import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
import stream from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return new Response(JSON.stringify({ error: "Invalid file uploaded" }), {
        status: 400,
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "votingApp",
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            console.error("Upload Error:", error);
            reject(new Error("Image upload failed"));
          } else {
            resolve(result);
          }
        }
      );

      const bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);
      bufferStream.pipe(uploadStream);
    });

    return new Response(
      JSON.stringify({ url: uploadResult.secure_url }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Upload Error:", error);
    return new Response(JSON.stringify({ error: "Image upload failed" }), {
      status: 500,
    });
  }
}
