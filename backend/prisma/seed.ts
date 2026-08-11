import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tickets = [
  { title: "Printer on 3rd floor won't turn on", description: "Tried the power button, nothing happens.", status: "open", priority: "medium" },
  { title: "Cannot reset password", description: "Reset email never arrives.", status: "open", priority: "high" },
  { title: "VPN drops every 10 minutes", status: "in_progress", priority: "high" },
  { title: "Request: extra monitor for new hire", status: "open", priority: "low" },
  { title: "Laptop fan making loud noise", status: "in_progress", priority: "medium" },
  { title: "Slack notifications not working on mobile", status: "closed", priority: "low" },
  { title: "Onboarding checklist missing SSO step", status: "closed", priority: "medium" },
] as const;

async function main() {
  await prisma.ticket.createMany({ data: tickets });
  console.log(`Seeded ${tickets.length} tickets.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
