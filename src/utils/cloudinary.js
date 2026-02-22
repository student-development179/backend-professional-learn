import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

//now we create a function to upload image with help of methods
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if(!localFilePath) return null;
    //upload the files in cloudinary
    const response =await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    })
    //file has been uploaded successfully
    console.log("file uploaded successfully on cloudinary",
      response.url);
      return response;

  } catch (error) {
    //remove the locally saved temporary file as the upload operation got failed
    fs.unlinkSync(localFilePath); 
    return null;
  }
}

export { uploadOnCloudinary };

//this is make we temporary upload
/*cloudinary.uploader.upload(
  "https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
  { public_id: "olympic_flag" }
)
.then(result => {
  console.log(result);
})
.catch(err => {
  console.error(err);
});
*/