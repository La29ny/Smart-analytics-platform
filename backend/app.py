from flask import Flask
from routes.upload import upload_bp
from routes.preprocess import preprocess_bp
from routes.visualize import visualize_bp
from routes.model import model_bp

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