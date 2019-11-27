#!/usr/bin/perl

use Text::CSV;


%con;
%header;
%candidates;


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



open(MISSING,">","temp/missing.tsv");
print MISSING "Constituency\tCandidate name\tParty\tDemocracy Club URL\n";
foreach $pcd (sort(keys(%con))){
	open(FILE,">:encoding(UTF-8)","constituencies/$pcd.json");
	print FILE "{\n";
	print FILE "\t\"id\": \"$pcd\",\n";
	print FILE "\t\"title\": \"$con{$pcd}{'cname1'}\",\n";
	print FILE "\t\"elections\": {\n";
	print FILE "\t\t\"2019\": {\n";
	print FILE "\t\t\t\"candidates\": [{\n";
	@candidates = @{$con{$pcd}{'candidates'}};
	for($c = 0; $c < @candidates ;$c++){
		if($c > 0){ print FILE "\t\t\t},{\n"; }
		$con{$pcd}{'candidates'}[$c]{'name'} =~ s/\"/\\\"/g;
		print FILE "\t\t\t\t\"id\": $con{$pcd}{'candidates'}[$c]{'id'},\n";
		print FILE "\t\t\t\t\"name\": \"$con{$pcd}{'candidates'}[$c]{'name'}\",\n";
		print FILE "\t\t\t\t\"party\": \"$con{$pcd}{'candidates'}[$c]{'party'}\",\n";
		print FILE "\t\t\t\t\"img\": \"$con{$pcd}{'candidates'}[$c]{'img'}\"\n";
		if($con{$pcd}{'candidates'}[$c]{'img'} eq ""){ print MISSING "$con{$pcd}{'cname1'}\t$con{$pcd}{'candidates'}[$c]{'name'}\t$con{$pcd}{'candidates'}[$c]{'party'}\thttps://candidates.democracyclub.org.uk/person/$con{$pcd}{'candidates'}[$c]{'id'}\n"; }
	}
	print FILE "\t\t\t}]\n";
	print FILE "\t\t},\n";
	print FILE "\t\t\"2017\": {\n";
	print FILE "\t\t\t\"first\": \"$con{$pcd}{'first17'}\",\n";
	print FILE "\t\t\t\"mp\": \"$con{$pcd}{'dispname'}\",\n";
	print FILE "\t\t\t\"mysoc\": \"$con{$pcd}{'mysocuri'}\",\n";
	print FILE "\t\t\t\"electorate\": $con{$pcd}{'elect17'},\n";
	print FILE "\t\t\t\"turnout\": $con{$pcd}{'turnout17'},\n";
	print FILE "\t\t\t\"valid\": $con{$pcd}{'valid17'},\n";
	print FILE "\t\t\t\"spoiled\": $con{$pcd}{'invalid17'},\n";
	print FILE "\t\t\t\"majority\": $con{$pcd}{'majority'}\n";
	print FILE "\t\t},\n";
	print FILE "\t\t\"2015\": {\n";
	print FILE "\t\t\t\"first\": \"$con{$pcd}{'2015-party_name'}\",\n";
	print FILE "\t\t\t\"mp\": \"$con{$pcd}{'2015-firstname'} $con{$pcd}{'2015-surname'}\",\n";
	print FILE "\t\t\t\"electorate\": $con{$pcd}{'2015-electorate'},\n";
	print FILE "\t\t\t\"turnout\": ".sprintf("%0.1f",100*($con{$pcd}{'2015-valid_votes'}+$con{$pcd}{'2015-invalid_votes'})/$con{$pcd}{'2015-electorate'}).",\n";
	print FILE "\t\t\t\"valid\": $con{$pcd}{'2015-valid_votes'},\n";
	print FILE "\t\t\t\"spoiled\": $con{$pcd}{'2015-invalid_votes'},\n";
	print FILE "\t\t\t\"majority\": $con{$pcd}{'2015-majority'}\n";
	print FILE "\t\t}\n";
	print FILE "\t}\n";
	print FILE "}";
	close(FILE);
}
close(MISSING);