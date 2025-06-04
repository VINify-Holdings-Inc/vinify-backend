import {
    BaseEntity,
    Column,
    Entity,
    Generated,
    PrimaryGeneratedColumn,
  } from "typeorm";
  
  @Entity({ name: "masterWebUrl" })
  export class MasterWebUrl extends BaseEntity {
  
    @PrimaryGeneratedColumn({ name: "id" })
    id: number;
  
    @Column({ name: "uuid", type: "varchar", unique: true })
    @Generated("uuid")
    uuid: string;
  
    @Column({
      name: "code",
      type: "varchar", 
      nullable: true,
      default: null,
    })
    code: string;
  
    @Column({
      name: "name",
      type: "varchar", 
      nullable: true,
      default: null,
    })
    name: string;

     @Column({
      name: "state",
      type: "varchar", 
      nullable: true,
      default: null,
    })
    state: string;

     @Column({
      name: "status",
      type: "varchar", 
      nullable: true,
      default: null,
    })
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
  