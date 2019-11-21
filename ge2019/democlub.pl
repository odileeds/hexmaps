#!/usr/bin/perl

use Text::CSV;


%con;
%header;
%candidates;


$url = "https://candidates.democracyclub.org.uk/media/candidates-parl.2019-12-12.csv";
$file = "candidates-parl.2019-12-12.csv";

`wget -q -O $file $url`;
			

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
		if(!$con{$pcd}){ $con{$pcd} = (); }
		push(@{$con{$pcd}},$fields[1]);
	}
	$line++;
}
close($fh);	

`rm $file`;

@cid = sort(keys(%con));
open(FILE,">","2019-candidates.csv");
print FILE "ccode,number\n";
foreach $c (@cid){
	$n = @{$con{$c}};
	print FILE "$c,$n\n";
}
close(FILE);

	
#id,name,honorific_prefix,honorific_suffix,gender,birth_date,election,party_id,party_name,post_id,post_label,mapit_url,elected,email,twitter_username,facebook_page_url,party_ppc_page_url,facebook_personal_url,homepage_url,wikipedia_url,linkedin_url,image_url,proxy_image_url_template,image_copyright,image_uploading_user,image_uploading_user_notes,twitter_user_id,election_date,election_current,party_lists_in_use,party_list_position,old_person_ids,gss_code,parlparse_id,theyworkforyou_url,party_ec_id,favourite_biscuits,cancelled_poll,wikidata_id,blog_url,instagram_url,youtube_profile
#11,Tom Crone,,,male,1980,parl.2019-12-12,party:63,Green Party,WMC:E14000793,"Liverpool, Riverside",,,tommartincrone@gmail.com,tommartincrone,https://www.facebook.com/LiverpoolGreenParty/,https://liverpool.greenparty.org.uk/,https://www.facebook.com/tom.crone.98,,,,https://static-candidates.democracyclub.org.uk/media/images/images/11.png,,profile-photo,zarino,https://twitter.com/tommartincrone,209285232,2019-12-12,True,False,,7683,,,,PP63,,False,Q73117387,,,
#15,Mark Williams,,,male,1966-03-24,parl.2019-12-12,party:90,Liberal Democrats,WMC:W07000064,Ceredigion,,,markfwilliams32@gmail.com,mark4ceredigion,https://www.facebook.com/mark4ceredigion,https://www.welshlibdems.wales/mark-williams,,http://www.markwilliams.org.uk/,https://en.wikipedia.org/wiki/Mark_Williams_%28politician%29,,https://static-candidates.democracyclub.org.uk/media/images/5481e8e4b150e238702c0610.png,,profile-photo,,,124312153,2019-12-12,True,False,,,,uk.org.publicwhip/person/uk.org.publicwhip/person/11489,http://www.theyworkforyou.com/mp/uk.org.publicwhip/person/11489,PP90,Chocolate Hobnob,False,Q266357,,,


