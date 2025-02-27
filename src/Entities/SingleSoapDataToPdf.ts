   import {
                BaseEntity,
                Column,
                Entity,
                PrimaryGeneratedColumn,
                Generated,
              } from "typeorm";
              
              @Entity({ name: "SingleSoapDataToPdf" })
              export class SingleSoapDataToPdf extends BaseEntity {
                @PrimaryGeneratedColumn({ name: "id" })
                @Generated("uuid")
                uuid: string;
              
                @Column({ name: "vin", type: "varchar", nullable: true })
                vin: string;
               
                @Column({ name: "brand", type: "varchar", nullable: true })
                brand: number; 
              
                @Column({ name: "alertDate", type: "varchar", nullable: true })
                alertDate: string;

                @Column({ name: "ReportingEntityCategoryCode", type: "varchar", nullable: true })
                ReportingEntityCategoryCode: string;

                @Column({ name: "IdentificationID", type: "varchar", nullable: true })
                IdentificationID: string;
             
                @Column({ name: "ReportingEntityCategoryText", type: "varchar", nullable: true })
                ReportingEntityCategoryText: string; 
                
                @Column({ name: "EntityName", type: "varchar", nullable: true })
                EntityName: string; 
                
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
              