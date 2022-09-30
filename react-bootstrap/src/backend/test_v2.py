import cv2
import pytesseract
import numpy as np
import pandas as pd
import scipy.spatial.distance
import re

# Import model
from model_v2 import model

# Test image
img_dir = 'ECN_CopyInstruction1-Page1.jpg'

#pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'


# Search for label in df
def search_in_df(df, th, ca):
    
    # For each header in input, extract coordinates in specified dataframe
    for i, v in enumerate(th):
        
        # Search for header in dataframe
        find_header = df.loc[df['text'].str.contains(v)]

        # Extract L, T, W, H of detected headers
        L = list(find_header['left'])
        T = list(find_header['top'])
        W = list(find_header['width'])
        H = list(find_header['height'])

        # If there is 1 or more matches, use the one that is closest to the model coordinates
        if len(list(find_header['text'])) > 0:

            # Use left and top coordinates to compare to model
            pix_L = [v for v in L]
            pix_T = [v for v in T]
            pix_LT = [[pix_L[i], pix_T[i]] for i in range(len(pix_L))]

            # Use match with minimum distance to model
            min_ind = np.argmin(scipy.spatial.distance.cdist([[ca[i][0], ca[i][1]]], pix_LT, metric='euclidean')[0])

            # Output current dataframe coordinates of text
            ca[i] = [L[min_ind] - 15, T[min_ind] - 15, W[min_ind], H[min_ind]]

        # Return nothing if the label was not found
        elif len(list(find_header['text'])) == 0:
            return None

    # Return updated coordinates array
    return ca


if __name__ == "__main__":

    # Preprocess image to make it optimal for Pytesseract to use
    img = cv2.imread(img_dir)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    img = cv2.threshold(img, 235, 255, cv2.THRESH_BINARY)[1]

    # Get image dimensions
    h, w = img.shape

    # Get scale from model (trained image dimensions)
    scale = [model["Scale"]["x"], model["Scale"]["y"]]
    x_f, y_f = w / scale[0], h / scale[1]

    # Extract text from processed image
    df = pytesseract.image_to_data(img, output_type="data.frame")
    df = df.loc[(df["conf"] != -1)]

    # Predict labels
    label_data = model["Label"]

    for i, v in enumerate(label_data):

        name = label_data[v]["l_name"]
        p1_txt, p1_txt_coord, p1_ind = label_data[v]["bounds"]["p1_txt"], label_data[v]["bounds"]["p1_txt_coord"], label_data[v]["bounds"]["p1_ind"]
        p2_txt, p2_txt_coord, p2_ind = label_data[v]["bounds"]["p2_txt"], label_data[v]["bounds"]["p2_txt_coord"], label_data[v]["bounds"]["p2_ind"]
        p3_txt, p3_txt_coord, p3_ind = label_data[v]["bounds"]["p3_txt"], label_data[v]["bounds"]["p3_txt_coord"], label_data[v]["bounds"]["p3_ind"]

        # Get p1_coord
        if p1_ind != "tl" and p1_ind != "tr" and p1_ind != "bl" and p1_ind != "br":
            p1_txt_coord_scaled = np.array(p1_txt_coord[0]) * np.array([x_f, y_f])
            p1_coord = search_in_df(df, [p1_txt], [list(p1_txt_coord_scaled)])[0]

        # Get p2_coord
        if p2_ind != "tl" and p2_ind != "tr" and p2_ind != "bl" and p2_ind != "br":
            p2_txt_coord_scaled = np.array(p2_txt_coord[0]) * np.array([x_f, y_f])
            p2_coord = search_in_df(df, [p2_txt], [list(p2_txt_coord_scaled)])[0]

        # Get p3_coord
        if p3_ind != "tl" and p3_ind != "tr" and p3_ind != "bl" and p3_ind != "br":
            p3_txt_coord_scaled = np.array(p3_txt_coord[0]) * np.array([x_f, y_f])
            p3_coord = search_in_df(df, [p3_txt], [list(p3_txt_coord_scaled)])[0]

        # Get fin_coords
        if p1_ind == 0:
            p1_coord = [p1_coord[0], p1_coord[1]]
        elif p1_ind == 1:
            p1_coord = [p1_coord[0] + p1_coord[2], p1_coord[1]]
        elif p1_ind == 2:
            p1_coord = [p1_coord[0], p1_coord[1] + p1_coord[3]]
        elif p1_ind == 3:
            p1_coord = [p1_coord[0] + p1_coord[2], p1_coord[1] + p1_coord[3]]
        elif p1_ind == "tl":
            p1_coord = [0, 0]
        elif p1_ind == "tr":
            p1_coord = [w, 0]
        elif p1_ind == "bl":
            p1_coord = [0, h]
        elif p1_ind == "br":
            p1_coord = [w, h]

        if p2_ind == 0:
            p2_coord = [p2_coord[0], p2_coord[1]]
        elif p2_ind == 1:
            p2_coord = [p2_coord[0] + p2_coord[2], p2_coord[1]]
        elif p2_ind == 2:
            p2_coord = [p2_coord[0], p2_coord[1] + p2_coord[3]]
        elif p2_ind == 3:
            p2_coord = [p2_coord[0] + p2_coord[2], p2_coord[1] + p2_coord[3]]
        elif p2_ind == "tl":
            p2_coord = [0, 0]
        elif p2_ind == "tr":
            p2_coord = [w, 0]
        elif p2_ind == "bl":
            p2_coord = [0, h]
        elif p2_ind == "br":
            p2_coord = [w, h]

        if p3_ind == 0:
            p3_coord = [p3_coord[0], p3_coord[1]]
        elif p3_ind == 1:
            p3_coord = [p3_coord[0] + p3_coord[2], p3_coord[1]]
        elif p3_ind == 2:
            p3_coord = [p3_coord[0], p3_coord[1] + p3_coord[3]]
        elif p3_ind == 3:
            p3_coord = [p3_coord[0] + p3_coord[2], p3_coord[1] + p3_coord[3]]
        elif p3_ind == "tl":
            p3_coord = [0, 0]
        elif p3_ind == "tr":
            p3_coord = [w, 0]
        elif p3_ind == "bl":
            p3_coord = [0, h]
        elif p3_ind == "br":
            p3_coord = [w, h]

        cv2.rectangle(img, pt1=(p1_coord[0],p1_coord[1]), pt2=(p2_coord[0],p3_coord[1]), color=(0,0,255), thickness=2)
        

    cv2.imwrite('output.jpg', img)        
        
