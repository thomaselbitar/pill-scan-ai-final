import torch
from torchvision import models, transforms
from PIL import Image
import json

class PharmacyClassifier:
    def __init__(self):
        # Create MobileNetV3 model
        self.model = models.mobilenet_v3_large(weights=None)

        num_classes = 153  # adjust if needed
        self.model.classifier[3] = torch.nn.Linear(1280, num_classes)

        # Load weights only
        state_dict = torch.load("mobilenetv3_pharmacy.pth", map_location="cpu")
        self.model.load_state_dict(state_dict)

        self.model.eval()

        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor()
        ])

        with open("class_names.json", "r") as f:
            self.idx_to_class = json.load(f)

    def predict(self, image: Image.Image):
        img_tensor = self.transform(image).unsqueeze(0)

        with torch.no_grad():
            output = self.model(img_tensor)
            probabilities = torch.nn.functional.softmax(output, dim=1)
            confidence, index = torch.max(probabilities, 1)
            confidence = confidence.item()
            index = index.item()

        return {
            "product_name": self.idx_to_class[str(index)],
            "confidence": confidence
        }
