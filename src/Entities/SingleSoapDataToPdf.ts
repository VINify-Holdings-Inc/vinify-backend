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
              
                @Column({ name: "titleBrandDate", type: "varchar", nullable: true })
                titleBrandDate: string;

                @Column({ name: "ReportingEntityCategoryCode", type: "varchar", nullable: true })
                ReportingEntityCategoryCode: string;

                @Column({ name: "IdentificationID", type: "varchar", nullable: true })
                IdentificationID: string;
             
                @Column({ name: "ReportingEntityCategoryText", type: "varchar", nullable: true })
                ReportingEntityCategoryText: string; 
                
                @Column({ name: "EntityName", type: "varchar", nullable: true })
                EntityName: string; 

                @Column({ name: "export", type: "varchar", nullable: true })
                export: string;

                @Column({ name: "status", type: "varchar", nullable: true })
                status: string;
              
                @Column({ name: "VehicleDispositionText", type: "varchar", nullable: true })
                VehicleDispositionText: string; 
              
                @Column({ name: "VehicleIntendedForExportCode", type: "varchar", nullable: true })
                VehicleIntendedForExportCode: string; 
              
                @Column({ name: "ContactEmailID", type: "varchar", nullable: true })
                ContactEmailID: string; 
              
                @Column({ name: "TelephoneNumberFullID", type: "varchar", nullable: true })
                TelephoneNumberFullID: string; 
              
                @Column({ name: "LocationCityName", type: "varchar", nullable: true })
                LocationCityName: string; 
              
                @Column({ name: "RecordMatchSequenceID", type: "varchar", nullable: true })
                RecordMatchSequenceID: string; 
                
                @Column({ name: "VehicleOdometerReadingUnitCode", type: "varchar", nullable: true })
                VehicleOdometerReadingUnitCode: string; 
              
                @Column({ name: "VehicleOdometerReadingMeasure", type: "varchar", nullable: true })
                VehicleOdometerReadingMeasure: string; 
                
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
              