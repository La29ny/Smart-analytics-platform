from flask import Flask
from routes.upload import upload_bp
from routes.preprocess import preprocess_bp
from routes.visualize import visualize_bp
from routes.model import model_bp

import os

app = Flask(__name__)

app.register_blueprint(upload_bp)
app.register_blueprint(preprocess_bp)
app.register_blueprint(visualize_bp)
app.register_blueprint(model_bp)

from routes.main_routes import main
app.register_blueprint(main)

from flask_cors import CORS
CORS(app)

from routes.nlp import nlp_bp
app.register_blueprint(nlp_bp)



from dotenv import load_dotenv
load_dotenv()

from flask_mail import Mail

app.config["MAIL_SERVER"] = "smtp.gmail.com"
app.config["MAIL_PORT"] = 587
app.config["MAIL_USE_TLS"] = True

app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")
app.config["MAIL_DEFAULT_SENDER"] = os.getenv("MAIL_DEFAULT_SENDER")

mail = Mail()

mail.init_app(app)

from routes.auth import auth_bp
app.register_blueprint(auth_bp)


from flask import send_from_directory
from config import UPLOAD_FOLDER

from routes.data_edit import data_edit_bp
app.register_blueprint(data_edit_bp)

@app.route('/images/<filename>')
def get_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route("/")
def home():
    return {"message": "Backend Running 🚀"}

if __name__ == "__main__":
    app.run(debug=True)