import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).lean<User>().exec();
  }

  async createUser(email: string, password: string, roles: string[] = ['user']) {
    const passwordHash = await bcrypt.hash(password, 10);
    const doc = new this.userModel({ email, passwordHash, roles });
    await doc.save();
    const id = (doc as any)._id?.toString?.() ?? String((doc as any)._id);
    return { _id: id, email: doc.email, roles: doc.roles };
  }

  async verifyPassword(email: string, password: string) {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;
    const id = (user as any)._id?.toString?.() ?? String((user as any)._id);
    return { _id: id, email: user.email, roles: user.roles };
  }

  async findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async addRole(userId: string, role: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { roles: role } },
      { new: true }
    ).lean<User>().exec();
  }

  async removeRole(userId: string, role: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { roles: role } },
      { new: true }
    ).lean<User>().exec();
  }

  async updatePasswordByEmail(email: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    return this.userModel.findOneAndUpdate(
      { email },
      { $set: { passwordHash } },
      { new: true }
    ).lean<User>().exec();
  }
}
