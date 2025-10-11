import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity({ name: "VinData" })
export class VinData extends BaseEntity {
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
    comment: "Alert Type (Lien, Impound, Export, etc.)",
  })
  alertType: string;

  // 🟢 Common date field replacing all others (LienDate, ExportDate, etc.)
  @Column({
    name: "titleBrandDate",
    type: "varchar",
    nullable: true,
    default: null,
    comment: "Alert-specific date (LienDate, ImpoundDate, etc.)",
  })
  titleBrandDate: string | null;

  // 🟢 Common event fields (present only where applicable)
  @Column({
    name: "lienholder",
    type: "varchar",
    nullable: true,
    default: null,
    comment: "Lienholder name (Lien only)",
  })
  lienholder: string | null;

  @Column({
    name: "state",
    type: "varchar",
    nullable: true,
    default: null,
    comment: "State of record (Impound, Export, StolenSummary)",
  })
  state: string | null;

  @Column({
    name: "status",
    type: "varchar",
    nullable: true,
    default: null,
    comment: "Status (StolenSummary only)",
  })
  status: string | null;

  @Column({
    name: "itemNumber",
    type: "varchar",
    nullable: true,
    default: null,
    comment: "Item number (EbayAuction only)",
  })
  itemNumber: string | null;

  @Column({
    name: "reason",
    type: "varchar",
    nullable: true,
    default: null,
    comment: "Reason or remark (Recall only)",
  })
  reason: string | null;

  // 🟢 Common control fields
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
 