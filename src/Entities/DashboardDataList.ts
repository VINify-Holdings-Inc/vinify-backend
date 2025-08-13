import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn,
    Generated,
} from "typeorm";

@Entity({ name: "DashboardDataList" })
export class DashboardDataList extends BaseEntity {
    @PrimaryGeneratedColumn({ name: "id", comment: "Primary key (UUID)" })
    @Generated("uuid")
    uuid: string;

    @Column({ name: "vin", type: "varchar", default: " ", comment: "Vehicle Identification Number" })
    vin: string;

    @Column({ name: "Title", type: "boolean", default: false, comment: "Indicates if title is present" })
    Title: boolean;

    @Column({ name: "Brand", type: "boolean", default: false, comment: "Indicates if brand is present" })
    Brand: boolean;

    @Column({ name: "JSI", type: "boolean", default: false, comment: "Indicates if JSI is present" })
    JSI: boolean;

    @Column({ name: "isOld", type: "boolean", default: false, comment: "Marks if record is old" })
    isOld: boolean;

    @Column({ name: "isTitleDel", type: "boolean", default: false, comment: "Marks if title is deleted" })
    isTitleDel: boolean;

    @Column({ name: "isBrandDel", type: "boolean", default: false, comment: "Marks if brand is deleted" })
    isBrandDel: boolean;

    @Column({ name: "isJSIDel", type: "boolean", default: false, comment: "Marks if JSI is deleted" })
    isJSIDel: boolean;

    @Column({ name: "alertType", type: "varchar", default: [], nullable: true, comment: "Type of alert triggered" })
    alertType: string;

    @Column({
        name: "createdAt",
        type: "timestamptz",
        default: () => "CURRENT_TIMESTAMP",
        comment: "Record creation timestamp",
    })
    createdAt: Date;

    @Column({
        name: "updatedAt",
        type: "timestamptz",
        default: () => "CURRENT_TIMESTAMP",
        comment: "Record last update timestamp",
    })
    updatedAt: Date;
}
