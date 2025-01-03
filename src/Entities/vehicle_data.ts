import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Generated,
} from "typeorm";

@Entity({ name: "VehicleData" })
export class VehicleData extends BaseEntity {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number; 

  @Column({ name: "uuid", type: "varchar", unique: true })
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
  brand: string;

  @Column({ name: "insurance", type: "varchar", nullable: true })
  insurance: string;

  @Column({ name: "junkSalvage", type: "varchar", nullable: true })
  junkSalvage: string;

  @Column({ name: "state", type: "varchar", nullable: true })
  state: string;

  @Column({ name: "resolutionStatus", type: "varchar", nullable: true })
  resolutionStatus: string;

  @Column({ name: "fraudState", type: "varchar", nullable: true })
  fraudState: string;

  @Column({ name: "currentStatus", type: "varchar", nullable: true })
  currentStatus: string;

  @Column({ name: "alertDate", type: "timestamptz", default: () => "CURRENT_TIMESTAMP", nullable: true  })
  alertDate: Date;

  @Column({ name: "actionRequired", type: "varchar", nullable: true })
  actionRequired: number;

  @Column({ name: "titleStatus", type: "varchar", nullable: true })
  titleStatus: number;

  @Column({ name: "fuelType", type: "varchar", nullable: true })
  fuelType: number;

  @Column({ name: "eventTypeId", type: "varchar", nullable: true })
  eventTypeId: number;

  @Column({ name: "eventDate", type: "timestamptz", default: () => "CURRENT_TIMESTAMP", nullable: true  })
  eventDate: Date;
  
  @Column({ name: "titleBrandDate", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" , nullable: true })
  titleBrandDate: Date;

  @Column({ name: "modelYear", type: "timestamptz", default: () => "CURRENT_TIMESTAMP", nullable: true  })
  modelYear: Date;
  
  @Column({ name: "summary", type: "text", nullable: true })
  summary: string;

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
