import os
path = "../ge2019/constituencies/"
codes = []
for f in os.listdir(path):
    if f[-4:] == 'json':
        codes.append(f[:-5])

from lxml import html
import requests
results = {}
for code in codes:
    url = "https://www.bbc.co.uk/news/politics/constituencies/" + code
    try:
        page = requests.get(url)
        tree = html.fromstring(page.content)
    
        votes = {}
        title = tree.xpath('//h1[@class="constituency-title__title"]')[0].text
        votes['title'] = title

        rows = tree.xpath('//div[@class="ge2019-constituency-result__row"]')
        for row in rows:
            party = row.xpath('./div/span[@class="ge2019-constituency-result__party-name"]')
            name = row.xpath('./div/span[@class="ge2019-constituency-result__candidate-name"]')

            result = row.getnext()
            vote = result.xpath('./ul/li/span/span[@class="ge2019-constituency-result__details-value"]')
            votes[int(vote[0].text.replace(',',''))] = (party[0].text, name[0].text)

        results[code] = votes
        print("{} {} done".format(title, len(results)))
    except Exception:
        print("could not get {}".format(url))

import json
with open('results.json', 'w') as fp:
    json.dump(results, fp, indent=2)
