package ke.co.aiccathedral.messenger;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.os.*;
import android.telephony.*;
import android.view.*;
import android.widget.*;
import java.io.*;
import java.net.*;
import java.util.*;
import org.json.*;

public class MainActivity extends Activity {
    static MainActivity instance;
    static final String SB_URL="https://rmarersocrwzqhnbuygi.supabase.co";
    static final String SB_KEY="sb_publishable_mVPoh33HbSN0Vyo5qHyWQQ_zgX38BUo";
    static final int REQ_SMS=41;
    LinearLayout root,list; EditText message; Spinner simSpinner; TextView counter,summary; Button send;
    ArrayList<Contact> contacts=new ArrayList<>(); ArrayList<SubscriptionInfo> sims=new ArrayList<>();
    Handler handler=new Handler(Looper.getMainLooper()); String accessToken="";
    int sent=0,failed=0,delivered=0,total=0; boolean sending=false;

    @Override public void onCreate(Bundle b){
        super.onCreate(b); instance=this; showLogin();
        if(Build.VERSION.SDK_INT>=23 && checkSelfPermission(Manifest.permission.SEND_SMS)!=PackageManager.PERMISSION_GRANTED)
            requestPermissions(new String[]{Manifest.permission.SEND_SMS,Manifest.permission.READ_PHONE_STATE},REQ_SMS);
    }
    TextView tv(String s,int size){TextView t=new TextView(this);t.setText(s);t.setTextSize(size);t.setTextColor(0xFF242024);t.setPadding(0,8,0,8);return t;}
    EditText field(String hint){EditText e=new EditText(this);e.setHint(hint);e.setPadding(12,8,12,8);return e;}
    void base(){ScrollView sc=new ScrollView(this);root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setPadding(28,24,28,28);sc.addView(root);setContentView(sc);}
    void showLogin(){
        base(); TextView b=tv("AIC CATHEDRAL",28);b.setTextColor(0xFF7A1F3D);b.setTypeface(null,1);root.addView(b);
        root.addView(tv("School SMS Messenger",16)); root.addView(tv("Sign in with your ERP account to load parents and students.",14));
        EditText email=field("ERP email"); email.setInputType(33); root.addView(email);
        EditText pass=field("Password"); pass.setInputType(129); root.addView(pass);
        Button login=new Button(this);login.setText("SIGN IN");root.addView(login);
        TextView status=tv("",14);root.addView(status);
        login.setOnClickListener(v->{login.setEnabled(false);status.setText("Signing in...");new Thread(()->{
            try{
                String body="{\"email\":"+JSONObject.quote(email.getText().toString().trim())+",\"password\":"+JSONObject.quote(pass.getText().toString())+"}";
                JSONObject j=request(SB_URL+"/auth/v1/token?grant_type=password","POST",body,null);
                accessToken=j.getString("access_token");
                runOnUiThread(this::showMessenger);
            }catch(Exception e){runOnUiThread(()->{status.setText("Login failed: "+e.getMessage());login.setEnabled(true);});}
        }).start();});
    }
    void showMessenger(){
        base(); TextView brand=tv("AIC CATHEDRAL",26);brand.setTextColor(0xFF7A1F3D);brand.setTypeface(null,1);root.addView(brand);
        root.addView(tv("ERP Parent SMS",15));
        LinearLayout card=new LinearLayout(this);card.setOrientation(LinearLayout.VERTICAL);card.setPadding(20,18,20,18);card.setBackgroundColor(0xFFF7F1F4);root.addView(card);
        counter=tv("0 / 100 selected",22);counter.setTypeface(null,1);card.addView(counter);
        Button load=new Button(this);load.setText("Refresh parents from ERP");load.setOnClickListener(v->loadParents());card.addView(load);
        list=new LinearLayout(this);list.setOrientation(LinearLayout.VERTICAL);card.addView(list);
        card.addView(tv("Sending SIM",14));simSpinner=new Spinner(this);card.addView(simSpinner);loadSims();
        message=field("Type SMS message");message.setMinLines(4);message.setGravity(Gravity.TOP);card.addView(message);
        send=new Button(this);send.setText("SEND SMS TO SELECTED");send.setOnClickListener(v->startSending());card.addView(send);
        summary=tv("No message sent yet",16);root.addView(summary);
        Button all=new Button(this);all.setText("Select all loaded parents (max 100)");all.setOnClickListener(v->{for(Contact c:contacts)c.selected=true;refresh();});root.addView(all);
        Button clear=new Button(this);clear.setText("Clear selection");clear.setOnClickListener(v->{for(Contact c:contacts)c.selected=false;refresh();});root.addView(clear);
        loadParents();
    }
    void loadParents(){
        summary.setText("Loading active students and parents from ERP...");
        new Thread(()->{
            try{
                String sel="id,first_name,middle_name,last_name,admission_number,student_parents(parent_id,primary_guardian,parents(id,name,phone,status))";
                String url=SB_URL+"/rest/v1/students?select="+URLEncoder.encode(sel,"UTF-8")+"&status=eq.active&order=first_name.asc";
                JSONObject[] arrObj={}; JSONArray a=new JSONArray(requestText(url,"GET",null,accessToken));
                ArrayList<Contact> loaded=new ArrayList<>();
                for(int i=0;i<a.length();i++){
                    JSONObject s=a.getJSONObject(i);JSONArray links=s.optJSONArray("student_parents");Contact chosen=null;
                    if(links!=null) for(int k=0;k<links.length();k++){JSONObject l=links.optJSONObject(k);JSONObject p=l==null?null:l.optJSONArray("parents")==null?null:l.optJSONArray("parents").optJSONObject(0);if(p!=null&&"active".equalsIgnoreCase(p.optString("status","active"))&&!p.optString("phone","").trim().isEmpty()&&l.optBoolean("primary_guardian")){chosen=new Contact(displayName(s),p.optString("phone"),p.optString("name"),s.optString("id"));break;}}
                    if(chosen==null&&links!=null) for(int k=0;k<links.length();k++){JSONObject l=links.optJSONObject(k);JSONObject p=l==null?null:l.optJSONArray("parents")==null?null:l.optJSONArray("parents").optJSONObject(0);if(p!=null&&"active".equalsIgnoreCase(p.optString("status","active"))&&!p.optString("phone","").trim().isEmpty()){chosen=new Contact(displayName(s),p.optString("phone"),p.optString("name"),s.optString("id"));break;}}
                    if(chosen!=null)loaded.add(chosen);
                }
                synchronized(contacts){contacts.clear();contacts.addAll(loaded);}
                runOnUiThread(()->{refresh();summary.setText(contacts.size()+" active parent contacts loaded from ERP.");});
            }catch(Exception e){runOnUiThread(()->summary.setText("Could not load ERP parents: "+e.getMessage()));}
        }).start();
    }
    String displayName(JSONObject s){String n=(s.optString("first_name","")+" "+s.optString("middle_name","")+" "+s.optString("last_name","")).replaceAll("\\s+"," ").trim();return n+" ("+s.optString("admission_number","")+")";}
    void refresh(){
        if(list==null)return;list.removeAllViews();int selected=0;
        for(int i=0;i<contacts.size();i++){Contact c=contacts.get(i);LinearLayout row=new LinearLayout(this);row.setGravity(Gravity.CENTER_VERTICAL);
            CheckBox cb=new CheckBox(this);cb.setChecked(c.selected);cb.setText(c.student+" — "+c.parent+" — "+c.phone);cb.setOnClickListener(v->{c.selected=cb.isChecked();updateCounter();});row.addView(cb);list.addView(row);if(c.selected)selected++;}
        updateCounter();
    }
    void updateCounter(){int n=0;for(Contact c:contacts)if(c.selected)n++;counter.setText(n+" / 100 selected");}
    void loadSims(){try{SubscriptionManager sm=(SubscriptionManager)getSystemService(TELEPHONY_SUBSCRIPTION_SERVICE);if(Build.VERSION.SDK_INT>=22&&checkSelfPermission(Manifest.permission.READ_PHONE_STATE)==PackageManager.PERMISSION_GRANTED){List<SubscriptionInfo>x=sm.getActiveSubscriptionInfoList();if(x!=null)sims.addAll(x);}}catch(Exception ignored){}ArrayList<String> names=new ArrayList<>();for(int i=0;i<sims.size();i++)names.add("SIM "+(i+1)+" • "+sims.get(i).getCarrierName());if(names.isEmpty())names.add("Default SIM");simSpinner.setAdapter(new ArrayAdapter<String>(this,android.R.layout.simple_spinner_dropdown_item,names));}
    void startSending(){if(sending)return;String body=message.getText().toString().trim();ArrayList<Contact> selected=new ArrayList<>();for(Contact c:contacts)if(c.selected)selected.add(c);if(selected.isEmpty()){toast("Select parents from the ERP list.");return;}if(selected.size()>100){toast("Maximum 100 recipients per batch.");return;}if(body.isEmpty()){toast("Enter an SMS message.");return;}if(body.length()>160){toast("Keep SMS at 160 characters or less.");return;}sendBatch(body,selected);}
    void sendBatch(String body,ArrayList<Contact> selected){if(Build.VERSION.SDK_INT>=23&&checkSelfPermission(Manifest.permission.SEND_SMS)!=PackageManager.PERMISSION_GRANTED){requestPermissions(new String[]{Manifest.permission.SEND_SMS},REQ_SMS);return;}sending=true;sent=failed=delivered=0;total=selected.size();send.setEnabled(false);summary.setText("Sending 0 / "+total+"...");int pos=simSpinner.getSelectedItemPosition();Integer sub=(pos>=0&&pos<sims.size())?sims.get(pos).getSubscriptionId():null;for(int i=0;i<selected.size();i++){final int ix=i;Contact c=selected.get(i);handler.postDelayed(()->sendOne(c.phone,ix,sub),i*650L);}}
    void sendOne(String phone,int index,Integer subId){try{SmsManager mgr=subId!=null?SmsManager.getSmsManagerForSubscriptionId(subId):SmsManager.getDefault();Intent si=new Intent(this,SmsStatusReceiver.class).setAction("AIC_SMS_SENT").putExtra("index",index);Intent di=new Intent(this,SmsStatusReceiver.class).setAction("AIC_SMS_DELIVERED").putExtra("index",index);int flags=Build.VERSION.SDK_INT>=23?PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE:PendingIntent.FLAG_UPDATE_CURRENT;mgr.sendTextMessage(phone,null,message.getText().toString().trim(),PendingIntent.getBroadcast(this,1000+index,si,flags),PendingIntent.getBroadcast(this,2000+index,di,flags));}catch(Exception e){failed++;updateSummary();}}
    void onSent(boolean ok,String phone){if(ok)sent++;else failed++;updateSummary();}
    void onDelivered(boolean ok){if(ok)delivered++;updateSummary();}
    void updateSummary(){runOnUiThread(()->{summary.setText("Sent: "+sent+"   Failed: "+failed+"   Delivered: "+delivered+"\\nProcessed: "+(sent+failed)+" / "+total);if(sent+failed>=total){sending=false;send.setEnabled(true);summary.setText("Finished • Sent "+sent+" • Failed "+failed+" • Delivered "+delivered+" / "+total);}});}
    JSONObject request(String url,String method,String body,String token)throws Exception{return new JSONObject(requestText(url,method,body,token));}
    String requestText(String url,String method,String body,String token)throws Exception{HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();c.setRequestMethod(method);c.setRequestProperty("apikey",SB_KEY);c.setRequestProperty("Content-Type","application/json");if(token!=null&&!token.isEmpty())c.setRequestProperty("Authorization","Bearer "+token);c.setDoInput(true);if(body!=null){c.setDoOutput(true);try(OutputStream o=c.getOutputStream()){o.write(body.getBytes("UTF-8"));}}int code=c.getResponseCode();InputStream in=code>=200&&code<300?c.getInputStream():c.getErrorStream();BufferedReader br=new BufferedReader(new InputStreamReader(in));StringBuilder sb=new StringBuilder();String line;while((line=br.readLine())!=null)sb.append(line);if(code<200||code>=300)throw new Exception("HTTP "+code+" "+sb);return sb.toString();}
    void toast(String s){Toast.makeText(this,s,Toast.LENGTH_SHORT).show();}
    static class Contact{String student,phone,parent,id;boolean selected;Contact(String s,String p,String pa,String i){student=s;phone=p;parent=pa;id=i;}}
    @Override protected void onDestroy(){super.onDestroy();if(instance==this)instance=null;}
}