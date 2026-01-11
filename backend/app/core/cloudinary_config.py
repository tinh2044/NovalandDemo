import cloudinary
import cloudinary.uploader
import cloudinary.api
from typing import Optional, Dict, Any
from fastapi import UploadFile

from app.core.config import configs


def configure_cloudinary():
    """Cấu hình Cloudinary"""
    cloudinary.config(
        cloud_name=configs.CLOUDINARY_CLOUD_NAME,
        api_key=configs.CLOUDINARY_API_KEY,
        api_secret=configs.CLOUDINARY_API_SECRET,
        secure=True,
    )


class CloudinaryService:
    def __init__(self):
        configure_cloudinary()

    async def upload_image(
        self,
        file: UploadFile,
        folder: str = "novaland/scenes",
        public_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Upload ảnh lên Cloudinary

        Args:
            file: File upload từ FastAPI
            folder: Thư mục trên Cloudinary
            public_id: ID tùy chỉnh cho ảnh

        Returns:
            Dict chứa thông tin ảnh đã upload
        """
        try:
            contents = await file.read()

            upload_options = {
                "folder": folder,
                "resource_type": "image",
            }

            if public_id:
                upload_options["public_id"] = public_id

            result = cloudinary.uploader.upload(contents, **upload_options)

            return {
                "public_id": result["public_id"],
                "url": result["secure_url"],
                "width": result["width"],
                "height": result["height"],
                "format": result["format"],
                "bytes": result["bytes"],
            }
        except Exception as e:
            raise Exception(f"Failed to upload image: {str(e)}")

    def delete_image(self, public_id: str) -> bool:
        """
        Xóa ảnh trên Cloudinary

        Args:
            public_id: ID của ảnh cần xóa

        Returns:
            True nếu xóa thành công
        """
        try:
            result = cloudinary.uploader.destroy(public_id)
            return result.get("result") == "ok"
        except Exception as e:
            raise Exception(f"Failed to delete image: {str(e)}")

    def get_image_url(self, public_id: str, **options) -> str:
        """
        Lấy URL của ảnh với các transform options

        Args:
            public_id: ID của ảnh
            options: Các tùy chọn transform (width, height, crop, etc.)

        Returns:
            URL của ảnh
        """
        return cloudinary.CloudinaryImage(public_id).build_url(**options)


# Singleton instance
cloudinary_service = CloudinaryService()
