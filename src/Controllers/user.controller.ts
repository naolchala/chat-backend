import { prisma } from "../config/prisma";
import { userSelect } from "../config/userSelect";

const setOnline = async (id: string, status: boolean) => {
    try {
        await prisma.user.update({
            where: { id },
            data: { isOnline: status, lastSeen: new Date().toISOString() },
        });
    } catch (error) {
        console.error(error);
    }
};

const getContactsID = async (id: string) => {
    const contacts = await prisma.user.findUnique({
        where: { id },
        select: {
            Contacted: {
                orderBy: {
                    lastContact: "desc",
                },
            },
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

const loadMessages = async (id: string, otherId: string) => {
    const messages = await prisma.message.findMany({
        where: {
            OR: [
                {
                    from_id: id,
                    to_id: otherId,
                },
                {
                    to_id: id,
                    from_id: otherId,
                },
            ],
        },
        take: 50,
        orderBy: {
            createdAt: "desc",
        },
    });

    return messages;
};

const sendMessage = async (id: string, otherId: string, message: any) => {
    await prisma.message.create({
        data: {
            content: message,
            from_id: id,
            to_id: otherId,
            createdAt: new Date().toISOString(),
            edited: false,
            seen: false,
        },
    });
};

export { setOnline, getContactsID, getContacts, loadMessages, sendMessage };
