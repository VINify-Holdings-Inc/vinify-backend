import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Generated,
} from "typeorm";

@Entity({ name: "VehicleDataTemp" })
export class VehicleDataTemp extends BaseEntity {
  @PrimaryGeneratedColumn({ name: "id" })
  @Generated("uuid")
  uuid: string;

  @Column({ name: "vin", type: "varchar", nullable: true })
  vin: string;

  @Column({ name: "vinId", type: "varchar", nullable: true })
  vinId: string; 

  @Column({ name: "model", type: "varchar", nullable: true })
  model: string;

  @Column({ name: "make", type: "varchar", nullable: true })
  make: string;

  @Column({ name: "brand", type: "varchar", nullable: true })
  brand: string;  

  @Column({ name: "state", type: "varchar", nullable: true })
  state: string;
 
  @Column({ name: "alertType", type: "varchar", nullable: true })
  alertType: string;

  @Column({ name: "titleBrandDate", type: "varchar", nullable: true })
  titleBrandDate: string;

  @Column({ name: "modelYear", type: "varchar", nullable: true })
  modelYear: string;

  @Column({ name: "status", type: "varchar", nullable: true })
  status: string;
  //             

  @Column({ name: "description", type: "varchar", nullable: true })
  description: string;

  @Column({ name: "export", type: "varchar", nullable: true })
  export: string;

  @Column({ name: "city", type: "varchar", nullable: true })
  city: string;

  @Column({ name: "rptgEntity", type: "varchar", nullable: true })
  rptgEntity: string; 

  @Column({ name: "rptgDetails", type: "varchar", nullable: true })
  rptgDetails: string; 

  @Column({ name: "isRead", type: "boolean", default: false })
  isRead: boolean;

  @Column({ name: "isOld", type: "boolean", default: true })
  isOld: boolean; 
  
  @Column({
    name: "createdAt",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @Column({
    name: "updatedAt",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt: Date;

  @Column({
    name: "createdBy",
    type: "varchar",
    length: 50,
    nullable: true,
    default: "system",
  })
  createdBy: string;

  @Column({
    name: "updatedBy",
    type: "varchar",
    length: 50,
    nullable: true,
    default: "system",
  })
  updatedBy: string;
}
