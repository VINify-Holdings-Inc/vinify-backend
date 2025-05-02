import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
    Generated,
} from "typeorm";

@Entity({ name: "DashboardDataList" })
export class DashboardDataList extends BaseEntity {
    @PrimaryGeneratedColumn({ name: "id" })
    @Generated("uuid")
    uuid: string;

    @Column({ name: "vin", type: "varchar", default: " " })
    vin: string;

    @Column({ name: "Title", type: "boolean", default: false })
    Title: boolean;


    @Column({ name: "Brand", type: "boolean", default: false })
    Brand: boolean;

    @Column({ name: "JSI", type: "boolean", default: false })
    JSI: boolean;

    @Column({ name: "isOld", type: "boolean", default: false })
    isOld: boolean;    

    @Column({ name: "isTitleDel", type: "boolean", default: false })
    isTitleDel: boolean; 

    @Column({ name: "isBrandDel", type: "boolean", default: false })
    isBrandDel: boolean;

    @Column({ name: "isJSIDel", type: "boolean", default: false })
    isJSIDel: boolean;

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
