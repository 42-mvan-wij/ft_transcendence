import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Avatar } from "./avatar.entity";
import { UploadAvatarInput } from "./dto/upload-avatar.input";

@Injectable()
export class AvatarService {
  constructor(
    @InjectRepository(Avatar)
    private readonly avatarRepository: Repository<Avatar>,
  ) {}

  async create(uploadAvatarInput: UploadAvatarInput)
  {
    const avatar = this.avatarRepository.create(uploadAvatarInput);
    return this.avatarRepository.save(avatar);
  }
}
