import { AVATAR_GROUPCHAT } from "./constants";

export function convertEncodedImage(imageFile: string) {
	if (!imageFile || imageFile.length < 10) return "/img/no_profile_picture.jpg";
	if (imageFile == AVATAR_GROUPCHAT) return imageFile;
	return "data:/img/png;base64," + imageFile;
}
