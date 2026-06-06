import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { MongodbService } from '../../database/mongodb.service';
import { ObjectId } from 'mongodb';

@Injectable()
export class AdminService {
  constructor(private readonly mongodb: MongodbService) {}

  async setup(email: string, password: string, name: string) {
    const db = this.mongodb.getDb();
    const existing = await db.collection('admins').findOne({ role: 'super_admin' });
    if (existing) throw new BadRequestException('Super admin already exists');

    const result = await db.collection('admins').insertOne({
      email: email.toLowerCase(),
      password,
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

    const result = await db.collection('admins').insertOne({
      email: email.toLowerCase(),
      password,
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
    if (admin.password !== password) throw new UnauthorizedException('Invalid credentials');

    if (admin.status === 'pending') {
      throw new ForbiddenException('Your account is pending super admin approval');
    }
    if (admin.status === 'declined') {
      throw new ForbiddenException(`Your account was declined${admin.declineReason ? ': ' + admin.declineReason : ''}`);
    }

    return {
      message: 'Login successful',
      token: admin._id.toString(),
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        status: admin.status,
      },
    };
  }

  async getProfile(adminId: string) {
    const db = this.mongodb.getDb();
    const admin = await db.collection('admins').findOne(
      { _id: new ObjectId(adminId) },
      { projection: { password: 0 } },
    );
    if (!admin) throw new UnauthorizedException('Invalid token');
    return admin;
  }

  async validateAdmin(authHeader: string) {
    if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedException('No token provided');
    const token = authHeader.slice(7);
    if (!ObjectId.isValid(token)) throw new UnauthorizedException('Invalid token');
    return this.getProfile(token);
  }

  async validateSuperAdmin(authHeader: string) {
    const admin = await this.validateAdmin(authHeader);
    if (admin.role !== 'super_admin') throw new ForbiddenException('Super admin access required');
    return admin;
  }

  // Super admin: list all admins (excluding super_admin themselves)
  async listAllAdmins() {
    const db = this.mongodb.getDb();
    return db
      .collection('admins')
      .find({ role: 'admin' }, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
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
      { $set: { status: 'declined', declineReason: reason || 'No reason given', reviewedAt: new Date() } },
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

  // Voter management (per election, used by admin)
  async getVoters(electionId: string) {
    const db = this.mongodb.getDb();
    const voters = await db.collection('voters').find({ electionId }).toArray();
    return voters;
  }

  async deleteVoter(electionId: string, matricNumber: string) {
    const db = this.mongodb.getDb();
    const lower = matricNumber.toLowerCase();
    await db.collection('voters').deleteOne({ electionId, matricNumber: lower });
    await db.collection('votes').deleteMany({ electionId, matricNumber: lower });
    return { message: 'Voter and their votes deleted' };
  }
}
