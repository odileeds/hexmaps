#!/usr/bin/perl


use Text::CSV;
use utf8;

$file = "temp/candidates-parl.2019-12-12.csv";
$size = "160";

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
		print $fields[0]." - ".$fields[1].": ".$fields[21]."\n";
		$file = "thumbnails/highres/$fields[0].jpg";
		if($fields[21]){
			#$file = $fields[21];
			#$file =~ s/^.*\/([^\/]*)$/$1/g;
			$ofile = "thumbnails/$fields[0].jpg";
			if(!-e $file){
				`wget -q -O $file "$fields[21]"`;
			}
			if(-s $file == 0){
				print "Unable to save $fields[21]\n";
			}
			#`rm $ofile`;
			if(-e $ofile){
				print "Already processed\n";
				`rm $ofile`;
			}#else{
				$s2 = $size*2;
				$cmd = "convert -define jpeg:size=".$s2."x".$s2." $file -thumbnail ".$size."x".$size."^ -gravity center -extent ".$size."x".$size." -format jpg -quality 80 $ofile";
#				$cmd = "convert $file -thumbnail x".$size." -resize '".$size."x<' -resize 50% -gravity center -crop ".$s2."x".$s2."+0+0 +repage -format jpg -quality 80 ".$ofile;
				print $cmd."\n";
				`$cmd`;
#					print "ERROR: Unable to convert $file (".(!(-e $ofile)).") to $ofile\n";
#				}
			#}
		}
	}
	$line++;
}
close($fh);	


#`wget -q -O $file $url`;



