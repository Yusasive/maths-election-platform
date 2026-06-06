import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { MongodbService } from '../../database/mongodb.service';
import { ObjectId } from 'mongodb';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const BCRYPT_ROUNDS = 12;

function jwtSecret(): string {
  return process.env.JWT_SECRET || 'dev-fallback-secret-change-in-production';
}

@Injectable()
export class AdminService {
  constructor(private readonly mongodb: MongodbService) {}

  async setup(email: string, password: string, name: string) {
    const db = this.mongodb.getDb();
    const existing = await db.collection('admins').findOne({ role: 'super_admin' });
    if (existing) throw new BadRequestException('Super admin already exists');

    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const result = await db.collection('admins').insertOne({
      email: email.toLowerCase(),
      password: hashed,
      name,
      role: 'super_admin',
      status: 'approved',
      createdAt: new Date(),
    });

    return { message: 'Super admin created', adminId: result.insertedId };
  }

  async isSuperAdminSetup() {
    const db = this.mongodb.getDb();
    const existing = await db.collection('admins').findOne({ role: 'super_admin' });
    return { exists: !!existing };
  }

  async register(email: string, password: string, name: string) {
    const db = this.mongodb.getDb();
    const existing = await db.collection('admins').findOne({ email: email.toLowerCase() });
    if (existing) throw new BadRequestException('An account with this email already exists');

    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const result = await db.collection('admins').insertOne({
      email: email.toLowerCase(),
      password: hashed,
      name,
      role: 'admin',
      status: 'pending',
      createdAt: new Date(),
    });

    return { message: 'Registration submitted. Await super admin approval.', adminId: result.insertedId };
  }

  async login(email: string, password: string) {
    const db = this.mongodb.getDb();
    const admin = await db.collection('admins').findOne({ email: email.toLowerCase() });

    if (!admin) throw new UnauthorizedException('Invalid credentials');

    // Migration: if password is not yet bcrypt-hashed, compare plaintext and re-hash on the fly
    const isHashed = admin.password?.startsWith('$2b$') || admin.password?.startsWith('$2a$');
    let match: boolean;
    if (isHashed) {
      match = await bcrypt.compare(password, admin.password);
    } else {
      match = password === admin.password;
      if (match) {
        const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
        await db.collection('admins').updateOne({ _id: admin._id }, { $set: { password: hashed } });
      }
    }

    if (!match) throw new UnauthorizedException('Invalid credentials');

    if (admin.status === 'pending') {
      throw new ForbiddenException('Your account is pending super admin approval');
    }
    if (admin.status === 'declined') {
      throw new ForbiddenException(
        `Your account was declined${admin.declineReason ? ': ' + admin.declineReason : ''}`,
      );
    }

    const token = jwt.sign(
      { sub: admin._id.toString(), role: admin.role, email: admin.email },
      jwtSecret(),
      { expiresIn: '8h' },
    );

    return {
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        status: admin.status,
        avatarUrl: admin.avatarUrl ?? null,
      },
    };
  }

  async getProfile(adminId: string) {
    const db = this.mongodb.getDb();
    let oid: ObjectId;
    try {
      oid = new ObjectId(adminId);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
    const admin = await db.collection('admins').findOne(
      { _id: oid },
      { projection: { password: 0 } },
    );
    if (!admin) throw new UnauthorizedException('Invalid token');
    return admin;
  }

  async validateAdmin(authHeader: string) {
    if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedException('No token provided');
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, jwtSecret()) as { sub: string; role: string };
      return this.getProfile(payload.sub);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async validateSuperAdmin(authHeader: string) {
    const admin = await this.validateAdmin(authHeader);
    if (admin.role !== 'super_admin') throw new ForbiddenException('Super admin access required');
    return admin;
  }

  async listAllAdmins(page = 1, limit = 20) {
    const db = this.mongodb.getDb();
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      db
        .collection('admins')
        .find({ role: 'admin' }, { projection: { password: 0 } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('admins').countDocuments({ role: 'admin' }),
    ]);
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async approveAdmin(adminId: string) {
    const db = this.mongodb.getDb();
    if (!ObjectId.isValid(adminId)) throw new BadRequestException('Invalid admin ID');

    const result = await db.collection('admins').updateOne(
      { _id: new ObjectId(adminId), role: 'admin' },
      { $set: { status: 'approved', reviewedAt: new Date(), declineReason: null } },
    );

    if (result.matchedCount === 0) throw new BadRequestException('Admin not found');
    return { message: 'Admin approved successfully' };
  }

  async declineAdmin(adminId: string, reason: string) {
    const db = this.mongodb.getDb();
    if (!ObjectId.isValid(adminId)) throw new BadRequestException('Invalid admin ID');

    const result = await db.collection('admins').updateOne(
      { _id: new ObjectId(adminId), role: 'admin' },
      {
        $set: {
          status: 'declined',
          declineReason: reason || 'No reason given',
          reviewedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) throw new BadRequestException('Admin not found');
    return { message: 'Admin declined' };
  }

  async deleteAdminAccount(adminId: string) {
    const db = this.mongodb.getDb();
    if (!ObjectId.isValid(adminId)) throw new BadRequestException('Invalid admin ID');
    await db.collection('admins').deleteOne({ _id: new ObjectId(adminId), role: 'admin' });
    return { message: 'Admin deleted' };
  }

  async getVoters(electionSlug: string, page = 1, limit = 50) {
    const db = this.mongodb.getDb();
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      db
        .collection('voters')
        .find({ electionSlug })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('voters').countDocuments({ electionSlug }),
    ]);
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async updateProfile(
    adminId: string,
    data: {
      name?: string;
      email?: string;
      avatarUrl?: string;
      currentPassword?: string;
      newPassword?: string;
    },
  ) {
    const db = this.mongodb.getDb();
    let oid: ObjectId;
    try { oid = new ObjectId(adminId); } catch { throw new UnauthorizedException('Invalid token'); }

    const admin = await db.collection('admins').findOne({ _id: oid });
    if (!admin) throw new UnauthorizedException('Admin not found');

    const update: Record<string, unknown> = {};

    if (data.name?.trim()) update.name = data.name.trim();

    if (data.email?.trim() && data.email.toLowerCase() !== admin.email) {
      const taken = await db.collection('admins').findOne({
        email: data.email.toLowerCase(),
        _id: { $ne: oid },
      });
      if (taken) throw new BadRequestException('Email is already in use');
      update.email = data.email.toLowerCase();
    }

    if (data.newPassword) {
      if (!data.currentPassword) {
        throw new BadRequestException('Current password is required to set a new password');
      }
      const isHashed = admin.password?.startsWith('$2b$') || admin.password?.startsWith('$2a$');
      const match = isHashed
        ? await bcrypt.compare(data.currentPassword, admin.password)
        : data.currentPassword === admin.password;
      if (!match) throw new BadRequestException('Current password is incorrect');
      update.password = await bcrypt.hash(data.newPassword, BCRYPT_ROUNDS);
    }

    if (data.avatarUrl !== undefined) update.avatarUrl = data.avatarUrl;

    if (Object.keys(update).length === 0) return { message: 'No changes to save' };

    update.updatedAt = new Date();
    await db.collection('admins').updateOne({ _id: oid }, { $set: update });

    const updated = await db.collection('admins').findOne(
      { _id: oid },
      { projection: { password: 0 } },
    );
    return { message: 'Profile updated successfully', admin: updated };
  }

  async deleteVoter(electionSlug: string, matricNumber: string) {
    const db = this.mongodb.getDb();
    const lower = matricNumber.toLowerCase();
    await db.collection('voters').deleteOne({ electionSlug, matricNumber: lower });
    await db.collection('votes').deleteMany({ electionSlug, matricNumber: lower });
    return { message: 'Voter and their votes deleted' };
  }
}
