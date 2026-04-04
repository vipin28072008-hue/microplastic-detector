"""
train_model.py  ——  Run in Google Colab (GPU Runtime)
=====================================================
This script:
  1. Organises dataset into train/val splits
  2. Trains a MobileNetV2 CNN (binary: microplastic vs clean)
  3. Saves the model as microplastic_model.h5
  4. Shows accuracy/loss graphs
  5. Prints final accuracy

BEFORE RUNNING:
  - Upload archive.zip to Colab
  - Run generate_clean.py first
"""

import os, shutil, random
import numpy as np
import matplotlib.pyplot as plt
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

print("TensorFlow version:", tf.__version__)
print("GPU available:", tf.config.list_physical_devices('GPU'))

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
MICRO_TRAIN   = "/content/dataset/microplastic/train"
MICRO_VALID   = "/content/dataset/microplastic/valid"
MICRO_TEST    = "/content/dataset/microplastic/test"
CLEAN_DIR     = "/content/dataset/clean_water"
WORK_DIR      = "/content/train_data"
MODEL_SAVE    = "/content/microplastic_model.h5"

IMG_SIZE      = (224, 224)
BATCH_SIZE    = 32
EPOCHS        = 25
RANDOM_SEED   = 42

random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)
tf.random.set_seed(RANDOM_SEED)

# ─────────────────────────────────────────────
# STEP 1 — Build train_data folder structure
# ─────────────────────────────────────────────
print("\n📂 Organising dataset...")

for split in ["train", "val"]:
    for cls in ["microplastic", "clean"]:
        os.makedirs(f"{WORK_DIR}/{split}/{cls}", exist_ok=True)

# Collect all microplastic images
micro_imgs = []
for folder in [MICRO_TRAIN, MICRO_VALID, MICRO_TEST]:
    if os.path.exists(folder):
        imgs = [os.path.join(folder, f) for f in os.listdir(folder)
                if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        micro_imgs += imgs
        print(f"  Found {len(imgs)} images in {folder}")

# Collect clean water images
clean_imgs = [os.path.join(CLEAN_DIR, f) for f in os.listdir(CLEAN_DIR)
              if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
print(f"  Found {len(clean_imgs)} clean water images")

# Split 85% train / 15% val
def copy_split(imgs, cls):
    random.shuffle(imgs)
    split = int(len(imgs) * 0.85)
    train_imgs, val_imgs = imgs[:split], imgs[split:]
    for src in train_imgs:
        shutil.copy(src, f"{WORK_DIR}/train/{cls}/{os.path.basename(src)}")
    for src in val_imgs:
        shutil.copy(src, f"{WORK_DIR}/val/{cls}/{os.path.basename(src)}")
    print(f"  {cls}: {len(train_imgs)} train | {len(val_imgs)} val")

copy_split(micro_imgs, "microplastic")
copy_split(clean_imgs, "clean")

train_micro = len(os.listdir(f"{WORK_DIR}/train/microplastic"))
train_clean = len(os.listdir(f"{WORK_DIR}/train/clean"))
val_micro   = len(os.listdir(f"{WORK_DIR}/val/microplastic"))
val_clean   = len(os.listdir(f"{WORK_DIR}/val/clean"))

print(f"\n✅ Dataset ready:")
print(f"   Train → microplastic: {train_micro} | clean: {train_clean}")
print(f"   Val   → microplastic: {val_micro}   | clean: {val_clean}")

# ─────────────────────────────────────────────
# STEP 2 — Data Generators with Augmentation
# ─────────────────────────────────────────────
print("\n🔄 Setting up data generators...")

train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=25,
    width_shift_range=0.1,
    height_shift_range=0.1,
    zoom_range=0.2,
    horizontal_flip=True,
    vertical_flip=True,
    brightness_range=[0.75, 1.25],
    fill_mode='nearest'
)

val_datagen = ImageDataGenerator(rescale=1./255)

train_gen = train_datagen.flow_from_directory(
    f"{WORK_DIR}/train",
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="binary",
    seed=RANDOM_SEED
)

val_gen = val_datagen.flow_from_directory(
    f"{WORK_DIR}/val",
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="binary",
    seed=RANDOM_SEED
)

print(f"Class indices: {train_gen.class_indices}")
# Expected: {'clean': 0, 'microplastic': 1}

# ─────────────────────────────────────────────
# STEP 3 — Build Model (MobileNetV2 transfer learning)
# ─────────────────────────────────────────────
print("\n🧠 Building CNN model...")

base_model = tf.keras.applications.MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights="imagenet"
)
base_model.trainable = False   # Freeze pretrained weights

model = models.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.BatchNormalization(),
    layers.Dense(256, activation="relu"),
    layers.Dropout(0.4),
    layers.Dense(128, activation="relu"),
    layers.Dropout(0.3),
    layers.Dense(1, activation="sigmoid")   # Binary output
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
    loss="binary_crossentropy",
    metrics=["accuracy", tf.keras.metrics.AUC(name="auc")]
)

model.summary()

# ─────────────────────────────────────────────
# STEP 4 — Train
# ─────────────────────────────────────────────
print("\n🚀 Training started...")

callbacks = [
    EarlyStopping(
        monitor="val_accuracy",
        patience=5,
        restore_best_weights=True,
        verbose=1
    ),
    ModelCheckpoint(
        MODEL_SAVE,
        monitor="val_accuracy",
        save_best_only=True,
        verbose=1
    ),
    ReduceLROnPlateau(
        monitor="val_loss",
        factor=0.5,
        patience=3,
        min_lr=1e-7,
        verbose=1
    )
]

history = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCHS,
    callbacks=callbacks,
    verbose=1
)

# ─────────────────────────────────────────────
# STEP 5 — Results & Graphs
# ─────────────────────────────────────────────
best_acc = max(history.history['val_accuracy'])
best_loss = min(history.history['val_loss'])

print(f"\n{'='*50}")
print(f"✅ TRAINING COMPLETE!")
print(f"   Best Val Accuracy : {best_acc:.4f} ({best_acc*100:.2f}%)")
print(f"   Best Val Loss     : {best_loss:.4f}")
print(f"   Model saved to    : {MODEL_SAVE}")
print(f"{'='*50}")

# Plot accuracy and loss
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

ax1.plot(history.history['accuracy'], label='Train Accuracy', color='#00B4D8', linewidth=2)
ax1.plot(history.history['val_accuracy'], label='Val Accuracy', color='#0B3C5D', linewidth=2)
ax1.set_title('Model Accuracy', fontsize=14, fontweight='bold')
ax1.set_xlabel('Epoch')
ax1.set_ylabel('Accuracy')
ax1.legend()
ax1.grid(True, alpha=0.3)
ax1.set_ylim([0, 1])

ax2.plot(history.history['loss'], label='Train Loss', color='#EF4444', linewidth=2)
ax2.plot(history.history['val_loss'], label='Val Loss', color='#F59E0B', linewidth=2)
ax2.set_title('Model Loss', fontsize=14, fontweight='bold')
ax2.set_xlabel('Epoch')
ax2.set_ylabel('Loss')
ax2.legend()
ax2.grid(True, alpha=0.3)

plt.suptitle('MicroPlastic Detector — CNN Training Results', fontsize=16, fontweight='bold')
plt.tight_layout()
plt.savefig('/content/training_results.png', dpi=150, bbox_inches='tight')
plt.show()
print("📊 Graph saved as /content/training_results.png")

# ─────────────────────────────────────────────
# STEP 6 — Quick Test on 5 val images
# ─────────────────────────────────────────────
print("\n🔍 Quick test on sample images...")
from tensorflow.keras.preprocessing import image as keras_image

test_model = tf.keras.models.load_model(MODEL_SAVE)

for cls in ["microplastic", "clean"]:
    cls_dir = f"{WORK_DIR}/val/{cls}"
    sample_files = random.sample(os.listdir(cls_dir), min(3, len(os.listdir(cls_dir))))
    for fname in sample_files:
        img_path = os.path.join(cls_dir, fname)
        img = keras_image.load_img(img_path, target_size=IMG_SIZE)
        arr = keras_image.img_to_array(img) / 255.0
        arr = np.expand_dims(arr, axis=0)
        pred = test_model.predict(arr, verbose=0)[0][0]
        predicted = "microplastic" if pred > 0.5 else "clean"
        correct = "✅" if predicted == cls else "❌"
        print(f"  {correct} True: {cls:15} | Predicted: {predicted:15} | Score: {pred:.4f}")

print(f"\n✅ Model is ready! Download: {MODEL_SAVE}")
print("👉 Next step: Download microplastic_model.h5 and put it in backend/model/")
