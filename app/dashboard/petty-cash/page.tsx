import PettyCash from '../finance/petty-cash'
import {PrototypePage} from '../_components/prototype-workspace'

export default function Page(){
 return <PrototypePage title="Petty Cash" subtitle="Petty cash vouchers, weekly balances, transactions and reports">
  <PettyCash/>
 </PrototypePage>
}
