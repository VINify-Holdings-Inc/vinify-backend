import {
    BaseEntity,
    Column,
    Entity,
    Generated,
    PrimaryGeneratedColumn,
} from "typeorm";

@Entity({ name: "VinCreateList" })
export class VinCreateList extends BaseEntity {

    @PrimaryGeneratedColumn({ name: "id" })
    @Generated("uuid")
    id: string;

    @Column({
        name: "vin",
        type: "varchar",
        length: 50,
        nullable: true,  
    })
    vin: string;

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
    
}
