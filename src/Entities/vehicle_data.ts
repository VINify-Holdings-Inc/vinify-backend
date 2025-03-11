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
  @Generated("uuid")
  uuid: string;

  @Column({ name: "vin", type: "varchar", default:'-'})
  vin: string;

  @Column({ name: "vinId", type: "varchar", default:'-'})
  vinId: string; 

  @Column({ name: "model", type: "varchar", default:'-'})
  model: string;

  @Column({ name: "make", type: "varchar", default:'-'})
  make: string;

  @Column({ name: "brand", type: "varchar", default:'-'})
  brand: string;  

  @Column({ name: "state", type: "varchar", default:'-'})
  state: string;
 
  @Column({ name: "alertType", type: "varchar", default:'-'})
  alertType: string;

  @Column({ name: "titleBrandDate", type: "varchar", default:'-'})
  titleBrandDate: string;

  @Column({ name: "modelYear", type: "varchar", default:'-'})
  modelYear: string;

  @Column({ name: "status", type: "varchar", default:'-'})
  status: string;
  //             

  @Column({ name: "description", type: "varchar", default:'-'})
  description: string;

  @Column({ name: "export", type: "varchar", default:'-'})
  export: string;

  @Column({ name: "city", type: "varchar", default:'-'})
  city: string;

  @Column({ name: "rptgEntity", type: "varchar", default:'-'})
  rptgEntity: string; 

  @Column({ name: "email", type: "varchar", default:'-'})
  email: string; 

  
  @Column({ name: "mobile", type: "varchar", default:'-'})
  mobile: string; 

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
