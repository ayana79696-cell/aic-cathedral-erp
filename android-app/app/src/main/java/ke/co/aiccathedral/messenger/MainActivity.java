package ke.co.aiccathedral.messenger;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.os.*;
import android.telephony.*;
import android.view.*;
import android.widget.*;
import java.util.*;
import java.util.concurrent.*;

public class MainActivity extends Activity {\n    static MainActivity instance;
    static final int REQ_SMS=41;
    LinearLayout root, list;
    EditText message;
    Spinner simSpinner;
    TextView counter, summary;
    Button send;
    ArrayList<Contact> contacts=new ArrayList<>();
    ArrayList<SubscriptionInfo> sims=new ArrayList<>();
    Handler handler=new Handler(Looper.getMainLooper());
    int sent=0, failed=0, delivered=0, total=0;
    boolean sending=false;

    @Override public void onCreate(Bundle b){
        super.onCreate(b);
        buildUi();
        if(Build.VERSION.SDK_INT>=23 && checkSelfPermission(Manifest.permission.SEND_SMS)!=PackageManager.PERMISSION_GRANTED)
            requestPermissions(new String[]{Manifest.permission.SEND_SMS,Manifest.permission.READ_PHONE_STATE},REQ_SMS);
        loadSims();
    }

    TextView tv(String s,int size){
        TextView t=new TextView(this); t.setText(s); t.setTextSize(size); t.setTextColor(0xFF242024);
        t.setPadding(0,8,0,8); return t;
    }
    void buildUi(){
        ScrollView sc=new ScrollView(this); root=new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setPadding(28,24,28,28); sc.addView(root); setContentView(sc);
        TextView brand=tv("AIC CATHEDRAL",26); brand.setTextColor(0xFF7A1F3D); brand.setTypeface(null,1); root.addView(brand);
        TextView sub=tv("School SMS Messenger",15); root.addView(sub);
        LinearLayout card=new LinearLayout(this); card.setOrientation(LinearLayout.VERTICAL); card.setPadding(20,18,20,18); card.setBackgroundColor(0xFFF7F1F4); root.addView(card);
        card.addView(tv("Recipients",14));
        counter=tv("0 / 100 selected",22); counter.setTypeface(null,1); card.addView(counter);
        Button add=new Button(this); add.setText("Add parent"); add.setOnClickListener(v->addContactDialog()); card.addView(add);
        list=new LinearLayout(this); list.setOrientation(LinearLayout.VERTICAL); card.addView(list);
        card.addView(tv("Sending SIM",14));
        simSpinner=new Spinner(this); card.addView(simSpinner);
        message=new EditText(this); message.setHint("Type your SMS message"); message.setGravity(Gravity.TOP); message.setMinLines(4); card.addView(message);
        send=new Button(this); send.setText("SEND SMS"); send.setOnClickListener(v->startSending()); card.addView(send);
        summary=tv("Ready to send",16); root.addView(summary);
        Button clear=new Button(this); clear.setText("Clear recipients"); clear.setOnClickListener(v->{contacts.clear();refresh();}); root.addView(clear);
    }

    void loadSims(){
        try{
            SubscriptionManager sm=(SubscriptionManager)getSystemService(TELEPHONY_SUBSCRIPTION_SERVICE);
            if(Build.VERSION.SDK_INT>=22 && checkSelfPermission(Manifest.permission.READ_PHONE_STATE)==PackageManager.PERMISSION_GRANTED)
                sims.addAll(sm.getActiveSubscriptionInfoList());
        }catch(Exception ignored){}
        ArrayList<String> names=new ArrayList<>();
        for(int i=0;i<sims.size();i++){
            SubscriptionInfo s=sims.get(i); names.add("SIM "+(i+1)+(s.getCarrierName()!=null?" • "+s.getCarrierName():""));
        }
        if(names.isEmpty()) names.add("Automatic / default SIM");
        simSpinner.setAdapter(new ArrayAdapter<String>(this,android.R.layout.simple_spinner_dropdown_item,names));
    }

    void addContactDialog(){
        if(contacts.size()>=100){toast("Maximum 100 recipients per batch.");return;}
        LinearLayout box=new LinearLayout(this); box.setOrientation(LinearLayout.VERTICAL);
        EditText name=new EditText(this); name.setHint("Student / parent name"); box.addView(name);
        EditText phone=new EditText(this); phone.setHint("Parent phone number"); phone.setInputType(2|3); box.addView(phone);
        new AlertDialog.Builder(this).setTitle("Add parent").setView(box).setPositiveButton("Add",(d,w)->{
            String p=phone.getText().toString().trim();
            if(p.length()<7){toast("Enter a valid phone number.");return;}
            contacts.add(new Contact(name.getText().toString().trim(),p)); refresh();
        }).setNegativeButton("Cancel",null).show();
    }
    void refresh(){
        counter.setText(contacts.size()+" / 100 selected"); list.removeAllViews();
        for(int i=0;i<contacts.size();i++){Contact c=contacts.get(i); TextView t=tv((i+1)+". "+(c.name.isEmpty()?"Parent":c.name)+"  "+c.phone,14); list.addView(t);}
    }
    void startSending(){
        if(sending)return;
        String body=message.getText().toString().trim();
        if(contacts.isEmpty()){toast("Add at least one parent.");return;}
        if(body.isEmpty()){toast("Enter a message.");return;}
        if(body.length()>160){new AlertDialog.Builder(this).setMessage("This SMS is longer than 160 characters and may be sent as multiple SMS parts. Continue?").setPositiveButton("Send", (d,w)->sendBatch(body)).setNegativeButton("Cancel",null).show();}
        else sendBatch(body);
    }
    void sendBatch(String body){
        if(Build.VERSION.SDK_INT>=23 && checkSelfPermission(Manifest.permission.SEND_SMS)!=PackageManager.PERMISSION_GRANTED){requestPermissions(new String[]{Manifest.permission.SEND_SMS},REQ_SMS);return;}
        sending=true; sent=failed=delivered=0; total=contacts.size(); send.setEnabled(false); summary.setText("Sending 0 / "+total+"...");
        int selected=simSpinner.getSelectedItemPosition();
        Integer subId=(selected>=0 && selected<sims.size())?sims.get(selected).getSubscriptionId():null;
        SmsBatch.reset(total);
        for(int i=0;i<contacts.size();i++){
            final int index=i; final Contact c=contacts.get(i);
            handler.postDelayed(()->sendOne(c.phone,body,index,subId),i*700L);
        }
    }
    void sendOne(String phone,String body,int index,Integer subId){
        try{
            SmsManager mgr;
            if(subId!=null && Build.VERSION.SDK_INT>=22) mgr=SmsManager.getSmsManagerForSubscriptionId(subId);
            else mgr=SmsManager.getDefault();
            Intent si=new Intent(this,SmsStatusReceiver.class).setAction("AIC_SMS_SENT").putExtra("index",index).putExtra("phone",phone);
            Intent di=new Intent(this,SmsStatusReceiver.class).setAction("AIC_SMS_DELIVERED").putExtra("index",index).putExtra("phone",phone);
            int flags=Build.VERSION.SDK_INT>=23?PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE:PendingIntent.FLAG_UPDATE_CURRENT;
            PendingIntent sp=PendingIntent.getBroadcast(this,1000+index,si,flags);
            PendingIntent dp=PendingIntent.getBroadcast(this,2000+index,di,flags);
            ArrayList<String> parts=mgr.divideMessage(body);
            if(parts.size()==1) mgr.sendTextMessage(phone,null,body,sp,dp);
            else mgr.sendMultipartTextMessage(phone,null,parts,Collections.singletonList(sp),Collections.singletonList(dp));
        }catch(Exception e){failed++;updateSummary();}
    }
    void onSent(boolean ok,String phone){
        if(ok)sent++; else failed++; updateSummary();
    }
    void onDelivered(boolean ok){if(ok)delivered++; updateSummary();}
    void updateSummary(){
        runOnUiThread(()->{
            summary.setText("Sent: "+sent+"   Failed: "+failed+"   Delivered: "+delivered+"\nProcessed: "+(sent+failed)+" / "+total);
            if(sent+failed>=total){sending=false;send.setEnabled(true); summary.setText("Finished • Sent "+sent+" • Failed "+failed+" • Delivered "+delivered+" / "+total);}
        });
    }
    @Override protected void onDestroy(){ super.onDestroy(); if(instance==this) instance=null; }\n    void toast(String s){Toast.makeText(this,s,Toast.LENGTH_SHORT).show();}
    static class Contact{String name,phone; Contact(String n,String p){name=n;phone=p;}}
}
