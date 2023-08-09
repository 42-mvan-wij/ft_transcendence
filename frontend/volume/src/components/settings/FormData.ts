export interface PictureForm {
	filename: string;
	file: string;
}

export class FormData {
	constructor(usernameArg: string, imageArg: PictureForm) {
		this.username = usernameArg;
		this.avatar = imageArg;
	}
	username: string;
	avatar: PictureForm;

	isIncomplete(): boolean {
		if (
			this.username == "" ||
			this.avatar == null ||
			this.avatar.filename == "" ||
			this.avatar.file == ""
		) {
			return true;
		}
		return false;
	}

	isEmpty(): boolean {
		if (this.username == "" && this.avatar == null) {
			return true;
		}
		return false;
	}
}
