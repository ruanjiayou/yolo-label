#!/bin/bash
CURRENT_DIR="$PWD"

# > "$CURRENT_DIR/mosquito_data.yaml"

# echo "path: $CURRENT_DIR/dataset
# train: images/train
# val: images/val
# nc: 1
# names: ['mosquito']" >> "$CURRENT_DIR/mosquito_data.yaml"

# yolo detect train data="$CURRENT_DIR/mosquito_data.yaml" model=yolov8s.pt epochs=100 imgsz=640 batch=16 patience=10 warmup_epochs=3 optimizer=AdamW lr0=0.002 momentum=0.937 weight_decay=0.0005
# 使用cuda  device=0
# yolo detect train data="$CURRENT_DIR/mosquito_data.yaml" model=yolov8s.pt device=0 epochs=100 patience=20 imgsz=640 batch=16 warmup_epochs=3 optimizer=AdamW lr0=0.002 momentum=0.937 weight_decay=0.0005 amp=True
# 打乱数据集,微调参数
yolo detect train data="$CURRENT_DIR/mosquito_data.yaml" model=runs/detect/train/weights/best.pt epochs=50 patience=10 imgsz=640 batch=16 warmup_epochs=3 optimizer=SGD lr0=0.001 weight_decay=0.0005 amp=True copy_paste=0.2 degrees=30.0

echo "✅ 训练完成！"
