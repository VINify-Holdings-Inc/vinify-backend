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

  @Column({ name: "member", type: "varchar", nullable: true })
  member: string; 
  
  @Column({ name: "model", type: "varchar", nullable: true })
  model: string;

  @Column({ name: "brand", type: "varchar", nullable: true })
  brand: number;

  @Column({ name: "insurance", type: "varchar", nullable: true })
  insurance: string;

  @Column({ name: "junkSalvage", type: "varchar", nullable: true })
  junkSalvage: string;

  @Column({ name: "state", type: "varchar", nullable: true })
  state: string;  
 
  @Column({ name: "alertDate", type: "varchar", nullable: true })
  alertDate: string;   
  
  @Column({ name: "titleBrandDate", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" , nullable: true })
  titleBrandDate: Date; 

  @Column({ name: "modelYear", type: "varchar", nullable: true })
  modelYear: string;
   
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