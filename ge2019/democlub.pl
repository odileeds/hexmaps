#!/usr/bin/perl


use Text::CSV;
use utf8;


%con;
%header;
%candidates;
%conlookup;
%parties;



##############################
# DEMOCRACY CLUB CANDIDATES
$url = "https://candidates.democracyclub.org.uk/media/candidates-parl.2019-12-12.csv";
$file = "temp/candidates-parl.2019-12-12.csv";

#`wget -q -O $file $url`;


#id,name,honorific_prefix,honorific_suffix,gender,birth_date,election,party_id,party_name,post_id,post_label,mapit_url,elected,email,twitter_username,facebook_page_url,party_ppc_page_url,facebook_personal_url,homepage_url,wikipedia_url,linkedin_url,image_url,proxy_image_url_template,image_copyright,image_uploading_user,image_uploading_user_notes,twitter_user_id,election_date,election_current,party_lists_in_use,party_list_position,old_person_ids,gss_code,parlparse_id,theyworkforyou_url,party_ec_id,favourite_biscuits,cancelled_poll,wikidata_id,blog_url,instagram_url,youtube_profile
#11,Tom Crone,,,male,1980,parl.2019-12-12,party:63,Green Party,WMC:E14000793,"Liverpool, Riverside",,,tommartincrone@gmail.com,tommartincrone,https://www.facebook.com/LiverpoolGreenParty/,https://liverpool.greenparty.org.uk/,https://www.facebook.com/tom.crone.98,,,,https://static-candidates.democracyclub.org.uk/media/images/images/11.png,,profile-photo,zarino,https://twitter.com/tommartincrone,209285232,2019-12-12,True,False,,7683,,,,PP63,,False,Q73117387,,,
my $csv = Text::CSV->new ({ binary => 1 });
open my $fh, "<", $file or die "$file: $!";
$line = 0;
while (my $row = $csv->getline ($fh)) {
	my @fields = @$row;
	$pcd = $fields[9];
	$pcd =~ s/^.*\://g;
	if($line == 0){
		for($i = 0; $i < @fields; $i++){
			$header{$fields[$i]} = $i;
		}
	}else{
		if(!$con{$pcd}){ $con{$pcd} = ('candidates'=>()); }
		push(@{$con{$pcd}{'candidates'}},{'name'=>$fields[1],'party'=>$fields[8],'id'=>$fields[0],'img'=>$fields[21]});
		$conlookup{$fields[10]} = $pcd;
	}
	$line++;
}
close($fh);	

#`rm $file`;


@cid = sort(keys(%con));
open(FILE,">","2019-candidates.csv");
print FILE "ccode,number\n";
foreach $c (@cid){
	$n = @{$con{$c}{'candidates'}};
	print FILE "$c,$n\n";
}
close(FILE);





################################
# 2019 
$file = "temp/wpc_2019_flat_file_v9.csv";
#objectid,ccode1,cname1,cnamelen,cname2,personid,firstname,lastname,partynow,partydisp,partycol,seconddisp,secondcol,mysocuri,fullname,dispname,mpimg,mnisId,photo_url,ccode2,rcode,cname3,county,ukpart,ukcountry,constype,last_vote,dec_time,just_time,dec_order,result17,first17,second17,seconddisp,elect17,valid17,invalid17,turnout17,majority,con,lab,ld,ukip,green,snp,pc,dup,sf,sdlp,uup,alliance,other,othwin,VOTES1,VOTES2,VOTES3,1VS2,2VS3,1VS3,REQSWING,FIRSTPCT,SECONDPCT,THIRDPCT,ons_id2,cname4,pop17,0_15_2017,16_64_2017,65_plus_17,mi_fr_pow,km_fr_pow,sq_km,sq_mi
my $csv = Text::CSV->new ({ binary => 1 });
open my $fh, "<", $file or die "$file: $!";
$line = 0;
@header = ();
while (my $row = $csv->getline ($fh)) {
	my @fields = @$row;
	$pcd = $fields[1];
	
	if($line == 0){
		@header = @fields;
	}else{
		for($i = 0; $i < @fields; $i++){
			$con{$pcd}{$header[$i]} = $fields[$i];
		}
	}
	$line++;
}
close($fh);	




################################
# 2019 electorate
$file = "temp/2019-electorate.csv";
#GSS Code,Constituency,LA,2017,2019,Change,%
my $csv = Text::CSV->new ({ binary => 1 });
open my $fh, "<", $file or die "$file: $!";
$line = 0;
@header = ();
while (my $row = $csv->getline ($fh)) {
	my @fields = @$row;
	$pcd = $fields[0];
	
	if($line == 0){
		@header = @fields;
	}else{
		$e = $fields[4];
		$e =~ s/(^"|"$|\,)//g;
		$con{$pcd}{'2019-electorate'} = $e;
	}
	$line++;
}
close($fh);	



########################################
# 2015 Results

# First read in the summary results
$file = "temp/hocl-ge2015-results-summary.csv";
#ons_id,ons_region_id,constituency_name,county_name,region_name,country_name,constituency_type,declaration_time,result,first_party,second_party,electorate,valid_votes,invalid_votes,majority,con,lab,ld,ukip,green,snp,pc,dup,sf,sdlp,uup,alliance,other
my $csv = Text::CSV->new ({ binary => 1 });
open my $fh, "<", $file or die "$file: $!";
$line = 0;
@header = ();
while (my $row = $csv->getline ($fh)) {
	my @fields = @$row;
	$pcd = $fields[0];
	
	if($line == 0){
		@header = @fields;
	}else{
		for($i = 0; $i < @fields; $i++){
			$con{$pcd}{'2015-'.$header[$i]} = $fields[$i];
		}
	}
	$line++;
}
close($fh);

# Now read in the full results to add data
$file = "temp/hocl-ge2015-results-full.csv";
#ons_id,ons_region_id,constituency_name,county_name,region_name,country_name,constituency_type,party_name,party_abbreviation,firstname,surname,gender,sitting_mp,former_mp,votes,share,change
my $csv = Text::CSV->new ({ binary => 1 });
open my $fh, "<", $file or die "$file: $!";
$line = 0;
@header = ();
while (my $row = $csv->getline ($fh)) {
	my @fields = @$row;
	$pcd = $fields[0];
	
	if($line == 0){
		@header = @fields;
	}else{
		for($i = 0; $i < @fields; $i++){
			# Take the first entry
			if(!$con{$pcd}{'2015-'.$header[$i]}){
				$con{$pcd}{'2015-'.$header[$i]} = $fields[$i];
			}
		}
	}
	$line++;
}
close($fh);	







###################################
# 2017 Results

# First read in the summary results
$file = "temp/HoC-GE2017-constituency-results.csv";
#ons_id,ons_region_id,constituency_name,county_name,region_name,country_name,constituency_type,declaration_time,result,first_party,second_party,electorate,valid_votes,invalid_votes,majority,con,lab,ld,ukip,green,snp,pc,dup,sf,sdlp,uup,alliance,other
my $csv = Text::CSV->new ({ binary => 1 });
open my $fh, "<", $file or die "$file: $!";
$line = 0;
@header = ();
while (my $row = $csv->getline ($fh)) {
	my @fields = @$row;
	$pcd = $fields[0];
	
	if($line == 0){
		@header = @fields;
	}else{
		for($i = 0; $i < @fields; $i++){
			$con{$pcd}{'2017-'.$header[$i]} = $fields[$i];
		}
	}
	$line++;
}
close($fh);


# Now read in the full results to add data
$file = "temp/HoC-GE2017-results-by-candidate.csv";
#ons_id,ons_region_id,constituency_name,county_name,region_name,country_name,constituency_type,party_name,party_abbreviation,firstname,surname,gender,sitting_mp,former_mp,votes,share,change
my $csv = Text::CSV->new ({ binary => 1 });
open my $fh, "<", $file or die "$file: $!";
$line = 0;
@header = ();
while (my $row = $csv->getline ($fh)) {
	my @fields = @$row;
	$pcd = $fields[0];
	
	if($line == 0){
		@header = @fields;
	}else{
		for($i = 0; $i < @fields; $i++){
			# Take the first candidate for this constituency
			if(!$con{$pcd}{'2017-'.$header[$i]}){
				$con{$pcd}{'2017-'.$header[$i]} = $fields[$i];
			}
			if(!$con{$pcd}{'2017-valid'}){ $con{$pcd}{'2017-valid'} = 0; }
			if($header[$i] eq "votes"){
				$con{$pcd}{'2017-valid'} += ($fields[$i]+0);
			}
		}
		if(!$con{$pcd}{'2017-candidates'}){ $con{$pcd}{'2017-candidates'} = (); }
		push(@{$con{$pcd}{'2017-candidates'}},{'name'=>$fields[9]." ".$fields[10],'partycode'=>$fields[8],'partytitle'=>$fields[7],'votes'=>$fields[14]});
	}
	$line++;
}
close($fh);	





#####################################
# Read in New Statesman demographics

$file = "temp/britainelects.csv";
#ONSConstID,Constituency Name,Country,Region,2016Leave,2015UKIP,age18-29,WhiteBritish,WithDegree
my $csv = Text::CSV->new ({ binary => 1 });
open my $fh, "<", $file or die "$file: $!";
$line = 0;
@header = ();
while (my $row = $csv->getline ($fh)) {
	my @fields = @$row;
	$pcd = $fields[0];
	
	
	if($line == 0){
		@header = @fields;
	}else{
		for($i = 0; $i < @fields; $i++){
			print "Saving britainelects-$header[$i]\n";
			if(!$con{$pcd}{'britainelects-'.$header[$i]}){
				$con{$pcd}{'britainelects-'.$header[$i]} = $fields[$i];
			}
		}
	}
	$line++;
}
close($fh);	




############################
# Read in by-elections file

# Now read in the full results to add data
$file = "temp/by-elections.csv";
#ons_id,constituency_name,date,turnout,majority,party_name,party_abbreviation,name,sitting_mp,votes,share,change
my $csv = Text::CSV->new ({ binary => 1 });
open my $fh, "<", $file or die "$file: $!";
$line = 0;
@header = ();
while (my $row = $csv->getline ($fh)) {
	my @fields = @$row;
	$pcd = $fields[0];
	
	if($line == 0){
		@header = @fields;
	}else{
		for($i = 0; $i < @fields; $i++){
			# Take the first candidate for this constituency
			if(!$con{$pcd}{'byelection-'.$header[$i]}){
				$con{$pcd}{'byelection-'.$header[$i]} = $fields[$i];
			}
			if(!$con{$pcd}{'byelection-valid'}){ $con{$pcd}{'byelection-valid'} = 0; }
			if($header[$i] eq "votes"){
				$con{$pcd}{'byelection-valid'} += ($fields[$i]+0);
			}
		}
	}
	$line++;
}
close($fh);	





%parties = ('Labour/Co-operative'=>'Lab','Labour and Co-operative'=>'Lab','Labour Party'=>'Lab','Labour and Co-operative Party'=>'Lab','Labour'=>'Lab','Conservative and Unionist Party'=>'Con','Conservative'=>'Con','Scottish National Party'=>'SNP','Scottish National Party (SNP)'=>'SNP','UK Independence Party'=>'UKIP','UK Independence Party (UKIP)'=>'UKIP','Social Democratic and Labour Party'=>'SDLP','Ulster Unionist Party'=>'UUP','Democratic Unionist Party'=>'DUP','DUP'=>'DUP','Independent'=>'Ind','Liberal Democrats'=>'LD','Liberal Democrat'=>'LD','Plaid Cymru'=>'PC','Speaker'=>'Spk','Scottish Green Party'=>'Green','Green Party'=>'Green','Green'=>'Green','Sinn Féin'=>'SF','Sinn Fein'=>'SF','Speaker seeking re-election'=>'Spk','Ex-Speaker'=>'','Plaid Cymru - The Party of Wales'=>'PC','The Brexit Party'=>'Brexit','Official Monster Raving Loony Party'=>'Monster','SDLP (Social Democratic & Labour Party)'=>'SDLP','Alliance - Alliance Party of Northern Ireland'=>'Alliance','Democratic Unionist Party - D.U.P.'=>'DUP','Social Democratic Party'=>'SDP','Christian Peoples Alliance'=>'Christian','Yorkshire Party'=>'YP','The Liberal Party'=>'Liberal','Christian Party "Proclaiming Christ\'s Lordship"'=>'Christian');

####################################
# End of 2017 Parliament

# Now read in the full results to add data
$file = "temp/mps-modified.csv";
#"Person ID","First name","Last name",Party,Constituency,URI
my $csv = Text::CSV->new ({ binary => 1 });
open my $fh, "<", $file or die "$file: $!";
$line = 0;
@header = ();
while (my $row = $csv->getline ($fh)) {
	my @fields = @$row;

	$pcd = $conlookup{$fields[4]};

	if($line == 0){
		@header = @fields;
		for($i = 0; $i < @header; $i++){
			$header[$i] =~ s/ /\-/;
		}
	}else{

		for($i = 0; $i < @fields; $i++){
		
			if($header[$i] eq "Party"){
				if($parties{$fields[3]}){
					$con{$pcd}{'2017-dissolution-party'} = $parties{$fields[3]};
					$con{$pcd}{'2017-dissolution-party-title'} = $fields[3];
				}else{
					print "Need to convert $fields[3]\n";
				}
			}
			$con{$pcd}{'2017-dissolution-name'} = $fields[1]." ".$fields[2];
		}
	}
	$line++;
}
close($fh);	



#########################
# Save end of 2017 Parliament
open(FILE,">","2017-dissolution.csv");
print FILE "ccode,dissolution17\n";
@cid = sort(keys(%con));
foreach $c (@cid){
	if($c){
		print FILE "$c,$con{$c}{'2017-dissolution-party'}\n";
	}
}
close(FILE);




%demo = ('britainelects-%: 2016 Leave'=>'leave','britainelects-%: with Degree'=>'withdegree','britainelects-%: age 18 - 29'=>'age18-29','britainelects-%: 2015 UKIP'=>'2015UKIP','2016Leave'=>'britainelects-%: 2016 Leave');

open(MISSING,">","temp/missing.tsv");
print MISSING "Constituency\tCandidate name\tParty\tDemocracy Club URL\n";
foreach $pcd (sort(keys(%con))){
	if(length($pcd) > 0){
		open(FILE,">:encoding(UTF-8)","constituencies/$pcd.json");
		print FILE "{\n";
		print FILE "\t\"id\": \"$pcd\",\n";
		print FILE "\t\"title\": \"$con{$pcd}{'cname1'}\",\n";
		print FILE "\t\"demographics\": {\n";
		$n = 0;
		foreach $d (sort(keys(%demo))){
			print "$d - $demo{$d} - $con{$pcd}{$d}\n";
			if($con{$pcd}{$d}){
				if($n > 0){ print FILE ",\n"; }
				print FILE "\t\t\"".$demo{$d}."\": ".$con{$pcd}{$d}."";
				$n++;
			}
		}
		print FILE "\n\t},\n";
		print FILE "\t\"elections\": {\n";
		print FILE "\t\t\"2019-12-12\": {\n";
		print FILE "\t\t\t\"type\": \"general\",\n";
		if($con{$pcd}{'2019-electorate'}){ print FILE "\t\t\t\"electorate\": $con{$pcd}{'2019-electorate'},\n"; }
		print FILE "\t\t\t\"candidates\": [{\n";
		@candidates = @{$con{$pcd}{'candidates'}};
		for($c = 0; $c < @candidates ;$c++){
			if($c > 0){ print FILE "\t\t\t},{\n"; }
			$con{$pcd}{'candidates'}[$c]{'name'} =~ s/\"/\\\"/g;
			print FILE "\t\t\t\t\"id\": $con{$pcd}{'candidates'}[$c]{'id'},\n";
			print FILE "\t\t\t\t\"name\": \"$con{$pcd}{'candidates'}[$c]{'name'}\",\n";
			if(!$parties{$con{$pcd}{'candidates'}[$c]{'party'}}){
				print "Need: $con{$pcd}{'candidates'}[$c]{'party'}\n";
			}
			print FILE "\t\t\t\t\"party\": { \"code\": \"$parties{$con{$pcd}{'candidates'}[$c]{'party'}}\", \"title\": \"".safeName($con{$pcd}{'candidates'}[$c]{'party'})."\" },\n";
			print FILE "\t\t\t\t\"img\": \"$con{$pcd}{'candidates'}[$c]{'img'}\"\n";
			if($con{$pcd}{'candidates'}[$c]{'img'} eq ""){ print MISSING "$con{$pcd}{'cname1'}\t$con{$pcd}{'candidates'}[$c]{'name'}\t$con{$pcd}{'candidates'}[$c]{'party'}\thttps://candidates.democracyclub.org.uk/person/$con{$pcd}{'candidates'}[$c]{'id'}\n"; }
		}
		print FILE "\t\t\t}]";
		if($con{$pcd}{'2017-dissolution-party'} ne $con{$pcd}{'first17'} && !$con{$pcd}{'byelection-name'}){
			print FILE ",\n";
			print FILE "\t\t\t\"incumbent\": {\n";
			print FILE "\t\t\t\t\"mp\": \"$con{$pcd}{'2017-dissolution-name'}\",\n";
			print FILE "\t\t\t\t\"party\": \{ \"code\": \"$con{$pcd}{'2017-dissolution-party'}\", \"title\": \"$con{$pcd}{'2017-dissolution-party-title'}\" }\n";
			print FILE "\t\t\t}";
		}
		print FILE "\n";
		print FILE "\t\t},\n";
		if($con{$pcd}{'byelection-name'}){
			print FILE "\t\t\"$con{$pcd}{'byelection-date'}\": {\n";
			print FILE "\t\t\t\"type\": \"by\",\n";
			print FILE "\t\t\t\"mp\": \"$con{$pcd}{'byelection-name'}\",\n";
			print FILE "\t\t\t\"party\": { \"code\": \"$con{$pcd}{'byelection-party_abbreviation'}\", \"title\": \"$con{$pcd}{'byelection-party_name'}\" },\n";
			print FILE "\t\t\t\"turnout\": { \"pc\": $con{$pcd}{'byelection-turnout_pc'}, \"value\": ".($con{$pcd}{'byelection-valid'}+$con{$pcd}{'byelection-invalid'})." },\n";
			print FILE "\t\t\t\"valid\": $con{$pcd}{'byelection-valid'},\n";
			print FILE "\t\t\t\"invalid\": $con{$pcd}{'byelection-invalid'},\n";
			print FILE "\t\t\t\"majority\": $con{$pcd}{'byelection-majority'}\n";
			print FILE "\t\t},\n";
		}
		print FILE "\t\t\"2017-06-08\": {\n";
		print FILE "\t\t\t\"type\": \"general\",\n";
		print FILE "\t\t\t\"mp\": \"$con{$pcd}{'2017-firstname'} $con{$pcd}{'2017-surname'}\",\n";
		print FILE "\t\t\t\"party\": { \"code\": \"$con{$pcd}{'first17'}\" },\n";
		#print FILE "\t\t\t\"mysoc\": \"$con{$pcd}{'mysocuri'}\",\n";
		print FILE "\t\t\t\"electorate\": $con{$pcd}{'elect17'},\n";
		print FILE "\t\t\t\"turnout\": { ";
		if($con{$pcd}{'2017-electorate'} > 0){
			print FILE "\"pc\": ".sprintf("%0.1f",100*($con{$pcd}{'2017-valid_votes'}+$con{$pcd}{'2017-invalid_votes'})/$con{$pcd}{'2017-electorate'}).", ";
		}
		print FILE "\"value\": ".($con{$pcd}{'2017-valid_votes'}+$con{$pcd}{'2017-invalid_votes'})." },\n";
		print FILE "\t\t\t\"valid\": $con{$pcd}{'2017-valid_votes'},\n";
		print FILE "\t\t\t\"invalid\": $con{$pcd}{'2017-invalid_votes'},\n";
		print FILE "\t\t\t\"majority\": $con{$pcd}{'2017-majority'},\n";
		print FILE "\t\t\t\"candidates\": [{\n";
		@candidates = @{$con{$pcd}{'2017-candidates'}};
		for($c = 0; $c < @candidates ;$c++){
			if($c > 0){ print FILE "\t\t\t},{\n"; }
			$con{$pcd}{'2017-candidates'}[$c]{'name'} =~ s/\"/\\\"/g;
			print FILE "\t\t\t\t\"name\": \"$con{$pcd}{'2017-candidates'}[$c]{'name'}\",\n";
			if(!$con{$pcd}{'2017-candidates'}[$c]{'partycode'}){
				print "Need: $pcd party $c $con{$pcd}{'2017-candidates'}[$c]{'partycode'}\n";
			}
			print FILE "\t\t\t\t\"party\": { \"code\": \"$con{$pcd}{'2017-candidates'}[$c]{'partycode'}\", \"title\": \"".safeName($con{$pcd}{'2017-candidates'}[$c]{'partytitle'})."\" },\n";
			print FILE "\t\t\t\t\"votes\": $con{$pcd}{'2017-candidates'}[$c]{'votes'}\n";
		}
		print FILE "\t\t\t}]\n";
		print FILE "\t\t},\n";
		print FILE "\t\t\"2015-05-07\": {\n";
		print FILE "\t\t\t\"type\": \"general\",\n";
		print FILE "\t\t\t\"mp\": \"$con{$pcd}{'2015-firstname'} $con{$pcd}{'2015-surname'}\",\n";
		print FILE "\t\t\t\"party\": { \"code\": \"".($parties{$con{$pcd}{'2015-party_name'}}||"")."\", \"title\": \"$con{$pcd}{'2015-party_name'}\" },\n";
		print FILE "\t\t\t\"electorate\": $con{$pcd}{'2015-electorate'},\n";
		$elect = $con{$pcd}{'2015-electorate'};
		if($elect > 0){
			$elect = 100*($con{$pcd}{'2015-valid_votes'}+$con{$pcd}{'2015-invalid_votes'})/$con{$pcd}{'2015-electorate'};
		}
		print FILE "\t\t\t\"turnout\": { \"pc\":".sprintf("%0.1f",$elect).", \"value\": ".($con{$pcd}{'2015-valid_votes'}+$con{$pcd}{'2015-invalid_votes'})." },\n";
		print FILE "\t\t\t\"valid\": $con{$pcd}{'2015-valid_votes'},\n";
		print FILE "\t\t\t\"invalid\": $con{$pcd}{'2015-invalid_votes'},\n";
		print FILE "\t\t\t\"majority\": $con{$pcd}{'2015-majority'}\n";
		print FILE "\t\t}\n";
		print FILE "\t}\n";
		print FILE "}";
		close(FILE);
	}
}
close(MISSING);


sub safeName(){
	my $name = $_[0];
	$name =~ s/\"/\\\"/g;
	return $name;
}