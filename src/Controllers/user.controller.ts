import { prisma } from "../config/prisma";
import { userSelect } from "../config/userSelect";

const setOnline = (id: string, status: boolean) => {
	try {
		prisma.user
			.update({
				where: { id },
				data: { isOnline: status, lastSeen: new Date().toISOString() },
			})
			.then((val) => {
				console.log(
					`user [${val.name}] ${val.isOnline ? "online" : "offline"}`
				);
			});
	} catch (error) {
		console.log(error);
	}
};

const getContactsID = async (id: string) => {
	const contacts = await prisma.contact.findMany({
		where: {
			OR: [
				{
					contacted_id: id,
				},
				{
					contacter_id: id,
				},
			],
		},
	});

	const contactsID = contacts.map((user) =>
		user.contacted_id == id ? user.contacter_id : user.contacted_id
	);
	return contactsID.filter((ids) => ids != id);
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
	const msg = await prisma.message.create({
		data: {
			content: message,
			from_id: id,
			to_id: otherId,
			createdAt: new Date().toISOString(),
			edited: false,
			seen: false,
		},
	});

	return msg;
};

const contactUsers = async (id: string, otherId: string) => {
	return await prisma.contact.create({
		data: {
			contacter_id: id,
			contacted_id: otherId,
		},
	});
};

export {
	setOnline,
	getContactsID,
	getContacts,
	loadMessages,
	sendMessage,
	contactUsers,
};
