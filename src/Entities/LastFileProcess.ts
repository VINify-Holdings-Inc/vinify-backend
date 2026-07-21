import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Generated,
} from "typeorm";

@Entity({ name: "LastFileProcess" })
export class LastFileProcess extends BaseEntity {
  @PrimaryGeneratedColumn({ name: "id" })
  @Generated("uuid")
  uuid: string;

  @Column({
    name: "lastRan",
    type: "timestamptz",
    nullable: true,
  })
  lastRan: Date;

  @Column({
    name: "createdAt",
    type: "timestamptz",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;  
}
