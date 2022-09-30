import cv2
import pytesseract
import numpy as np
import pandas as pd
import scipy.spatial.distance
import pprint
import json

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Image location
file_name = 'ECN_CopyInstruction6-Page1.jpg'

# Preprocess image
img = cv2.imread(file_name)
img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
img = cv2.threshold(img, 235, 255, cv2.THRESH_BINARY)[1]

# Resize image
h, w = img.shape
reduc_factor = w/960
re_x, re_y = int(w/reduc_factor), int(h/reduc_factor)
imS = cv2.resize(img, (re_x, re_y))

# Convert image to data
df = pytesseract.image_to_data(img, output_type='data.frame')
df = df.loc[(df['conf'] != -1) & (df['text'] != '') & (df['text'].str.isspace() == False)]
np.savetxt(r'df.txt', df.values, fmt='%s')
print(df)

# Annotate image with word detections
l_arr, t_arr, w_arr, h_arr, txt_arr = np.array(list(df['left'])), np.array(list(df['top'])), np.array(list(df['width'])), np.array(list(df['height'])), np.array(list(df['text']))
l_arr, t_arr, w_arr, h_arr = l_arr/reduc_factor-2, t_arr/reduc_factor-2, w_arr/reduc_factor+4, h_arr/reduc_factor+4
coords_arr, text_coords_map = [], []

# Loop through all texts and build mapping between text and coordinates, as well as all clickable coordinates
for i, v in enumerate(l_arr):

    # Extract each value as an int
    l_int, t_int, w_int, h_int = int(l_arr[i]), int(t_arr[i]), int(w_arr[i]), int(h_arr[i])

    # p1 = top_left, p2 = top_right, p3 = bottom_left, p4 = bottom_right
    p1, p2, p3, p4 = (l_int, t_int), (l_int+w_int, t_int), (l_int, t_int+h_int), (l_int+w_int, t_int+h_int)

    # Build map
    coords_arr += [p1, p2, p3, p4]
    text_coords_map += [[txt_arr[i],p1,p2,p3,p4]]
    
    # Create rectangle encompassing detected text
    cv2.rectangle(imS, pt1=p1, pt2=p4, color=(0,0,255))


# Add the corners of the page as valid points to click
coords_arr += [(0,0), (0,re_y), (re_x,0), (re_x,re_y)]

# Initialize global variables for draw_rectangle_with_clicks callback function
click_num = 0
past_coords, past_rems, past_divs = [], [], []

# Model Information
model_out = {"Label": {}}
label_num = 0

def draw_rectangle_with_clicks(event, x, y, flags, param):
    
    global imS, coords_arr, click_num, past_coords, past_rems, past_divs
    global model_out, label_num

    if event == cv2.EVENT_LBUTTONDOWN:

        # Compute distance between mouse click location and coords_arr
        dists = scipy.spatial.distance.cdist([[x,y]], coords_arr, metric='euclidean')[0]
        filt_ind = np.where(dists < 10)[0]

        # If there is a close enough index, draw a circle at the target point
        if len(filt_ind) != 0:

            targ_ind = filt_ind[0]
            targ_point = coords_arr[targ_ind]
            div, rem = int(targ_ind/4), targ_ind % 4
            past_rems += [rem]
            past_divs += [div]

            cv2.circle(imS, targ_point, radius=4, color=(0,0,255), thickness=2)

            # First click: starting point for bbox
            if click_num == 0:
                past_coords += [targ_point]
                click_num += 1
                print('Choose Point 2')
                
            # Second click: defines bbox width
            elif click_num == 1:
                past_coords += [targ_point]
                click_num += 1
                print('Choose Point 3')
            
            # Third click: defines bbox height. Draw rectangle using info from past clicks.
            elif click_num == 2:
                cv2.rectangle(imS, pt1=(past_coords[0][0],past_coords[0][1]), pt2=(past_coords[1][0],targ_point[1]), color=(0,0,255), thickness=2)
                click_num = 0

                if past_coords[0] == (0,0):
                    p1_txt, p1_ind = "tl", "tl"
                    p1_txt_coord = [past_coords[0]]
                elif past_coords[0] == (re_x,0):
                    p1_txt, p1_ind = "tr", "tr"
                    p1_txt_coord = [past_coords[0]]
                elif past_coords[0] == (0,re_y):
                    p1_txt, p1_ind = "bl", "bl"
                    p1_txt_coord = [past_coords[0]]
                elif past_coords[0] == (re_x,re_y):
                    p1_txt, p1_ind = "br", "br"
                    p1_txt_coord = [past_coords[0]]
                else:
                    p1_txt = text_coords_map[past_divs[0]][0]
                    p1_txt_coord = text_coords_map[past_divs[0]][1:]
                    p1_ind = past_rems[0]


                if past_coords[1] == (0,0):
                    p2_txt, p2_ind = "tl", "tl"
                    p2_txt_coord = [past_coords[1]]
                elif past_coords[1] == (re_x,0):
                    p2_txt, p2_ind = "tr", "tr"
                    p2_txt_coord = [past_coords[1]]
                elif past_coords[1] == (0,re_y):
                    p2_txt, p2_ind = "bl", "bl"
                    p2_txt_coord = [past_coords[1]]
                elif past_coords[1] == (re_x,re_y):
                    p2_txt, p2_ind = "br", "br"
                    p2_txt_coord = [past_coords[1]]
                else:
                    p2_txt = text_coords_map[past_divs[1]][0]
                    p2_txt_coord = text_coords_map[past_divs[1]][1:]
                    p2_ind = past_rems[1]

                if targ_point == (0,0):
                    p3_txt, p3_ind = "tl", "tl"
                    p3_txt_coord = [targ_point]
                elif targ_point == (re_x,0):
                    p3_txt, p3_ind = "tr", "tr"
                    p3_txt_coord = [targ_point]
                elif targ_point == (0,re_y):
                    p3_txt, p3_ind = "bl", "bl"
                    p3_txt_coord = [targ_point]
                elif targ_point == (re_x,re_y):
                    p3_txt, p3_ind = "br", "br"
                    p3_txt_coord = [targ_point]
                else:
                    p3_txt = text_coords_map[past_divs[2]][0]    
                    p3_txt_coord = text_coords_map[past_divs[2]][1:]
                    p3_ind = past_rems[2]            


                model_out["Label"]["label_" + str(label_num)] = {"bounds": {"p1_txt": p1_txt.replace(":",""),
                                                                            "p1_txt_coord": p1_txt_coord,
                                                                            "p1_ind": p1_ind,
                                                                            "p2_txt": p2_txt.replace(":",""),
                                                                            "p2_txt_coord": p2_txt_coord,
                                                                            "p2_ind": p2_ind,
                                                                            "p3_txt": p3_txt.replace(":",""),
                                                                            "p3_txt_coord": p3_txt_coord,
                                                                            "p3_ind": p3_ind
                                                                           },
                                                                  "l_name": "label_" + str(label_num)
                                                                }
                
                past_rems, past_divs, past_coords = [], [], []
                label_num += 1

                pprint.pprint(model_out, sort_dicts=False)


                print('Choose Point 1')


if __name__ == '__main__':

    # Set callback
    cv2.namedWindow(winname='image')
    cv2.setMouseCallback('image', draw_rectangle_with_clicks)

    while True:
        cv2.imshow('image', imS)
        if cv2.waitKey(33) == 27:
            break

    # Add Scale to Model
    model_out["Scale"] = {"x": re_x, "y": re_y}

    # Export model
    f = open("model_v2.py", "w")
    f.write("model = " + str(model_out))
    f.close()
