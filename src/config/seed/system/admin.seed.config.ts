import {UserTypeEnum} from "@interface/generic.enum";
import {CustomerInterface} from "@interface/model";
import environmentVariable from "../../custom-environment-variables";
import config from "../../index";

export const agentSeedData: Partial<CustomerInterface> = {
    email: config(environmentVariable.SEED_ADMIN_EMAIL),
    password: "Admin@admin123",
    isDeleted: false,
    name: "Agent Admin",
    userType: UserTypeEnum.AGENT,
};

const adminSeedsData: Partial<CustomerInterface>[] = [agentSeedData];
export default adminSeedsData;
