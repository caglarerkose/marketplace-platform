"use client";
import { AdminOverview } from "@/components/admin-overview";
import { AdminShell, useAdmin } from "@/components/admin-shell";
import { SectionContent } from "@/components/section-content";
import { allSections } from "@/data/admin";
function AdminContent(){const{active}=useAdmin(),section=allSections.find(item=>item.id===active)||allSections[0];return <div className="content"><section className="section active">{section.kind==="overview"?<AdminOverview/>:<SectionContent section={section}/>}</section></div>}
export default function AdminPage(){return <AdminShell><AdminContent/></AdminShell>}
