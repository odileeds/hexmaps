#!/usr/bin/perl

use utf8;
use JSON::XS;
use Data::Dumper;

$hexjsonfile = "../uk-wards-2022.hexjson";

if($ARGV[0] eq "split"){
	splitRegions();
}elsif($ARGV[0] eq "combine"){
	combineRegions();
}






#############################

sub getJSON {
	my (@files,$str,@lines);
	my $file = $_[0];
	open(FILE,$file);
	@lines = <FILE>;
	close(FILE);
	$str = join("",@lines);
	return JSON::XS->new->decode($str);	
}

sub makeJSON {
	my $json = shift;
	
	$txt = JSON::XS->new->utf8->canonical(1)->pretty->space_before(0)->encode($json);
	
	$txt =~ s/   /\t/g;

	$txt =~ s/(\t{3}.*)\n/$1/g;
	$txt =~ s/\,\t{3}/\, /g;
	$txt =~ s/\t{2}\}(\,?)\n/ \}$1\n/g;
	$txt =~ s/\{\n\t{3}/\{ /g;
	
	$txt =~ s/\"\: /\"\:/g;
	$txt =~ s/\, \"/\,\"/g;
	$txt =~ s/":\{ "/":\{"/g;
	$txt =~ s/\" \},/\"\},/g;
	
	return $txt;
}

sub splitRegions {
	print "Splitting regions in $hexjsonfile\n";
	my ($regions,$id,$region,$fh);
	my $hexjson = getJSON($hexjsonfile);
	
	foreach $id (keys(%{$hexjson->{'hexes'}})){
#		print "$id\n";
		$region = $hexjson->{'hexes'}{$id}{'region'};
		if(!$regions->{$region}){
			$regions->{$region} = {'layout'=>$hexjson->{'layout'},'hexes'=>{}};
		}
		$regions->{$region}{'hexes'}{$id} = $hexjson->{'hexes'}{$id};
	}
	
	foreach $region (sort(keys(%{$regions}))){
		print $region."\n";
		open($fh,">",$region.".hexjson");
		print $fh makeJSON($regions->{$region});
		close($fh);
	}
}

sub combineRegions {
	my ($tmp,$dh,$filename,$json,$hex,$fh);
	$json = {'layout'=>'odd-r','hexes'=>{}};
	opendir($dh,"./");
	while(($filename = readdir($dh))){
		if($filename =~ /[ENSW][0-9]{8}.hexjson$/){
			print "Read from $filename\n";
			$tmp = getJSON($filename);
			foreach $hex (keys(%{$tmp->{'hexes'}})){
				$json->{'hexes'}{$hex} = $tmp->{'hexes'}{$hex};
			}
		}
	}
	closedir($dh);

	open($fh,">","../uk-wards-2022.hexjson");
	print $fh makeJSON($json);
	close($fh);
}