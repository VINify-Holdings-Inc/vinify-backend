import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Generated,
} from "typeorm";

@Entity({ name: "VehicleInfo" })
export class VehicleInfo extends BaseEntity {
  @PrimaryGeneratedColumn({ name: "id" })
  id: string;

  @Column({ name: "uuid", type: "varchar", unique: true })
  @Generated("uuid")
  uuid: string;

  @Column({ name: "vin", type: "varchar", nullable: true })
  vin: string;

  @Column({ name: "userId", type: "varchar", nullable: true })
  userId: string; 

  @Column({ name: "modelYear", type: "varchar", nullable: true })
  modelYear: string;

  @Column({ name: "title", type: "varchar", nullable: true })
  title: string;

  @Column({ name: "brand", type: "varchar", nullable: true })
  brand: string;

  @Column({ name: "insurance", type: "varchar", nullable: true })
  insurance: string;
  
  @Column({ name: "junkSalvage", type: "varchar", nullable: true })
  junkSalvage: string;

  @Column({ name: "vehicleDetails", type: "varchar", nullable: true })
  vehicleDetails: string;

  @Column({ name: "status", type: "varchar", nullable: true })
  status: string;

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
    default: null,
  })
  createdBy: string;

  @Column({
    name: "updatedBy",
    type: "varchar",
    length: 50,
    nullable: true,
    default: null,
  })
  updatedBy: string;
}
