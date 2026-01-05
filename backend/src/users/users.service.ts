import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './user.schema';
import * as bcrypt from 'bcryptjs';

export interface UserWithId extends User {
  _id: Types.ObjectId;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserWithId | null> {
    return this.userModel.findOne({ email }).lean<UserWithId>().exec();
  }

  async createUser(email: string, password: string, roles: string[] = ['user']): Promise<{ _id: string; email: string; roles: string[] }> {
    const passwordHash = await bcrypt.hash(password, 10);
    const doc = new this.userModel({ email, passwordHash, roles });
    await doc.save();
    return { _id: (doc._id as Types.ObjectId).toString(), email: doc.email, roles: doc.roles };
  }

  async verifyPassword(email: string, password: string): Promise<{ _id: string; email: string; roles: string[] } | null> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;
    return { _id: (user._id as Types.ObjectId).toString(), email: user.email, roles: user.roles };
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async addRole(userId: string, role: string): Promise<UserWithId | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { roles: role } },
      { new: true }
    ).lean<UserWithId>().exec();
  }

  async removeRole(userId: string, role: string): Promise<UserWithId | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { roles: role } },
      { new: true }
    ).lean<UserWithId>().exec();
  }

  async updatePasswordByEmail(email: string, password: string): Promise<UserWithId | null> {
    const passwordHash = await bcrypt.hash(password, 10);
    return this.userModel.findOneAndUpdate(
      { email },
      { $set: { passwordHash } },
      { new: true }
    ).lean<UserWithId>().exec();
  }
}
