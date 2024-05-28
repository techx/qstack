# import boto3
# from PIL import Image
# from io import BytesIO
# from server.config import (
#     AWS_ACCESS_KEY_ID,
#     AWS_SECRET_ACCESS_KEY,
#     AWS_BUCKET_NAME,
#     TARGET_IMAGE_PATH,
# )

# MODEL_REMOTE_PATH = "v1-5-pruned-emaonly.ckpt"

# s3 = boto3.client(
#     "s3",
#     aws_access_key_id=AWS_ACCESS_KEY_ID,
#     aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
# )


# def pil_to_s3(image):
#     # image: pil image
#     buffer = BytesIO()
#     image.save(buffer, format="png")
#     buffer.seek(0)
#     print("uploading image to s3...")
#     s3.upload_fileobj(buffer, AWS_BUCKET_NAME, TARGET_IMAGE_PATH)
#     print("image uploaded to s3 successfully.")
#     buffer.close()


# def s3_to_pil():
#     print("downloading image from s3...")
#     response = s3.get_object(Bucket=AWS_BUCKET_NAME, Key=TARGET_IMAGE_PATH)
#     print("image downloaded from s3 successfully.")
#     image_data = response["Body"].read()
#     image_bytes = BytesIO(image_data)
#     image = Image.open(image_bytes)
#     if image.mode == "RGBA":
#         image = image.convert("RGB")
#     return image