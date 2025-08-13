import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Generated,
} from "typeorm";

@Entity({ name: "VehicleDataTemp" })
export class VehicleDataTemp extends BaseEntity {

  @PrimaryGeneratedColumn({ name: "id", comment: "Primary key UUID" })
  @Generated("uuid")
  uuid: string;

  @Column({ name: "vin", type: "varchar", default: " ", comment: "Vehicle Identification Number" })
  vin: string;

  @Column({ name: "vinId", type: "varchar", default: "", comment: "VIN secondary reference" })
  vinId: string;

  @Column({ name: "brand", type: "varchar", default: "", comment: "Vehicle brand" })
  brand: string;

  @Column({ name: "state", type: "varchar", default: "", comment: "Vehicle registration state" })
  state: string;

  @Column({ name: "alertType", type: "varchar", default: "", comment: "date" })
  alertType: string;

  @Column({ name: "titleBrandDate", type: "varchar", default: "", comment: "Date when title brand was applied" })
  titleBrandDate: string;

  @Column({ name: "status", type: "varchar", default: "", comment: "Vehicle status" })
  status: string;

  @Column({ name: "titleUnique", type: "varchar", default: "", comment: "odometer" })
  titleUnique: string;

  @Column({ name: "description", type: "varchar", default: "", comment: "Description or notes" })
  description: string;

  @Column({ name: "export", type: "varchar", default: "", comment: "Export status of the vehicle" })
  export: string;

  @Column({ name: "city", type: "varchar", default: "", comment: "City where vehicle is located or registered" })
  city: string;

  @Column({ name: "rptgEntity", type: "varchar", default: "", comment: "Reporting entity or organization" })
  rptgEntity: string;

  @Column({ name: "email", type: "varchar", default: "", comment: "Contact email" })
  email: string;

  @Column({ name: "mobile", type: "varchar", default: "", comment: "Contact mobile number" })
  mobile: string;

  @Column({ name: "isRead", type: "boolean", default: false, comment: "Flag if the record is read" })
  isRead: boolean;

  @Column({ name: "isOld", type: "boolean", default: false, comment: "Flag if the record is old" })
  isOld: boolean;

  @Column({ name: "isDel", type: "boolean", default: false, comment: "Flag if the record is deleted" })
  isDel: boolean;

  @Column({
    name: "createdAt",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    comment: "Record creation timestamp",
  })
  createdAt: Date;

  @Column({
    name: "updatedAt",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
    comment: "Last record update timestamp",
  })
  updatedAt: Date;

  @Column({
    name: "createdBy",
    type: "varchar",
    length: 50,
    nullable: true,
    default: "system",
    comment: "User who created the record",
  })
  createdBy: string;

  @Column({
    name: "updatedBy",
    type: "varchar",
    length: 50,
    nullable: true,
    default: "system",
    comment: "User who last updated the record",
  })
  updatedBy: string;
}



