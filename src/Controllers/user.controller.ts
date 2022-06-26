import { prisma } from "../config/prisma";
import { userSelect } from "../config/userSelect";

const setOnline = async (id: string, status: boolean) =>
    await prisma.user.update({
        where: { id },
        data: { isOnline: status, lastSeen: new Date().toISOString() },
    });

const getContactsID = async (id: string) => {
    const contacts = await prisma.user.findUnique({
        where: { id },
        select: {
            Contacted: true,
        },
    });

    const contactsID = contacts.Contacted.map((user) => user.contacted_id);
    return contactsID;
};

const getContacts = async (id: string) => {
    const contactsId = await getContactsID(id);
    return await prisma.user.findMany({
        where: {
            id: {
                in: contactsId,
            },
        },
        select: userSelect,
    });
};
export { setOnline, getContactsID, getContacts };
