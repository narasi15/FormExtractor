from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
@app.route("/api/images")
def train_image():
    return [[45, 45, 45, 45]]


if __name__ == '__main__':
    
   app.run(debug=True)









    