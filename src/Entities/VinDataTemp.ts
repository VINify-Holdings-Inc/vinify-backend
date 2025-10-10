import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn, 
} from "typeorm";

@Entity({ name: "VinDataTemp" })
export class VinDataTemp extends BaseEntity {
  @PrimaryGeneratedColumn("uuid", { name: "id", comment: "Primary key UUID" })
  id: string;

  @Column({
    name: "vin",
    type: "varchar",
    default: " ",
    comment: "Vehicle Identification Number",
  })
  vin: string;

  @Column({
    name: "alertType",
    type: "varchar",
    default: " ",
    comment: "Alert Type",
  })
  alertType: string;

  @Column({
    name: "Lienholder",
    type: "varchar",
    default: null,
    nullable: true,
    comment: "Lienholder name",
  })
  Lienholder: string | null;

  @Column({
    name: "LienDate",
    type: "varchar",
    default: null,
    nullable: true,
    comment: "Lien date",
  })
  LienDate: string | null;

  @Column({
    name: "ImpoundDate",
    type: "varchar",
    default: null,
    nullable: true,
    comment: "Impound date",
  })
  ImpoundDate: string | null;

  @Column({
    name: "State",
    type: "varchar",
    default: null,
    nullable: true,
    comment: "State of record",
  })
  State: string | null;

  @Column({
    name: "ExportDate",
    type: "varchar",
    default: null,
    nullable: true,
    comment: "Export date",
  })
  ExportDate: string | null;

  @Column({
    name: "Status",
    type: "varchar",
    default: null,
    nullable: true,
    comment: "Vehicle status",
  })
  Status: string | null;

  @Column({
    name: "LastEventDate",
    type: "varchar",
    default: null,
    nullable: true,
    comment: "Last event date",
  })
  LastEventDate: string | null;

  @Column({
    name: "ItemNumber",
    type: "varchar",
    default: null,
    nullable: true,
    comment: "Item number",
  })
  ItemNumber: string | null;

  @Column({
    name: "AuctionDate",
    type: "varchar",
    default: null,
    nullable: true,
    comment: "Auction date",
  })
  AuctionDate: string | null;

  @Column({
    name: "Reason",
    type: "varchar",
    default: null,
    nullable: true,
    comment: "Reason or remark",
  })
  Reason: string | null;

  @Column({
    name: "isRead",
    type: "boolean",
    default: false,
    comment: "Flag if the record is read",
  })
  isRead: boolean;

  @Column({
    name: "isOld",
    type: "boolean",
    default: false,
    comment: "Flag if the record is old",
  })
  isOld: boolean;

  @Column({
    name: "isDel",
    type: "boolean",
    default: false,
    comment: "Flag if the record is deleted",
  })
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
