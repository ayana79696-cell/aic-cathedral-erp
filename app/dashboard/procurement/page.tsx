import SimpleCrud from '../_components/simple-crud'
import {PrototypePage} from '../_components/prototype-workspace'

const cats=['Kitchen','Stationery','Spares','General inventory']

function ProcurementSection(){return <PrototypePage title="Procurement" subtitle="Choose one procurement function at a time. Only the selected function is shown." tabs={[["#requisitions","Requisitions"],["#documents","LPOs & Job Cards"],["#suppliers","Suppliers"],["#approvals","Approvals"]]}>
 <section id="requisitions"><SimpleCrud table="procurement_requests" title="Requisitions" fields={[{name:'item_name',label:'Item / service',required:true},{name:'quantity',label:'Quantity',type:'number',required:true},{name:'estimated_cost',label:'Estimated cost',type:'number',required:true},{name:'status',label:'Approval status',options:['pending','approved','ordered','received','rejected']}]} roleHint="Approved requisitions feed the LPO / job-card workflow."/></section>
 <section id="documents"><SimpleCrud table="procurement_documents" title="LPOs, Job Cards, Invoices & Delivery" fields={[{name:'document_type',label:'Document',options:['LPO','Job Card','Invoice','Delivery Note']},{name:'document_no',label:'Document No.'},{name:'amount',label:'Amount',type:'number'},{name:'status',label:'Status',options:['draft','generated','approved','received','paid']}]} /></section>
 <section id="suppliers"><SimpleCrud table="suppliers" title="Supplier details" fields={[{name:'name',label:'Supplier name',required:true},{name:'contact_person',label:'Contact person'},{name:'phone',label:'Phone'},{name:'email',label:'Email'},{name:'tax_pin',label:'KRA PIN'},{name:'address',label:'Address'},{name:'status',label:'Status',options:['active','inactive']}]} /></section>
 <section id="approvals"><SimpleCrud table="procurement_approvals" title="Procurement approvals" fields={[{name:'approver_id',label:'Approver user ID'},{name:'decision',label:'Decision',options:['pending','approved','rejected']},{name:'comments',label:'Comments'}]} /></section>
 </PrototypePage>}

function InventorySection(){return <PrototypePage title="Inventory" subtitle="Choose one inventory function at a time. Item IDs are not shown." tabs={[["#all-items","Stock Register"],["#stock-in","Stock In"],["#low-stock","Low-Stock Alerts"]]}>
 <section id="all-items"><SimpleCrud table="inventory_items" title="Stock register" fields={[{name:'item_name',label:'Item name',required:true},{name:'category',label:'Store category',options:cats},{name:'quantity',label:'Quantity',type:'number',required:true},{name:'unit',label:'Unit'},{name:'reorder_level',label:'Reorder level',type:'number'}]} /></section>
 <section id="stock-in"><SimpleCrud table="inventory_transactions" title="Stock in" fields={[{name:'item_name',label:'Item name',required:true},{name:'transaction_type',label:'Movement',options:['received']},{name:'quantity',label:'Quantity received',type:'number',required:true},{name:'note',label:'Note'}]} /></section>
 <section id="low-stock" className="prototype-panel"><div className="prototype-panel-head"><h2>Low-stock alerts</h2></div><div className="prototype-panel-body"><p className="prototype-note">Items at or below their reorder level should be reviewed before the next procurement cycle.</p></div></section>
 </PrototypePage>}

export default function Page(){return <PrototypePage title="Procurement & Inventory" subtitle="One simple workspace. Choose Procurement or Inventory, then open only the function you need." tabs={[["#procurement","Procurement"],["#inventory","Inventory"]]}>
 <section id="procurement"><ProcurementSection/></section>
 <section id="inventory"><InventorySection/></section>
 </PrototypePage>}
