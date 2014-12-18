#!/usr/bin/python
import json
from HTMLParser import HTMLParser
from lxml import html
from lxml.etree import tostring
import urllib, urllib2

class MyHTMLParser(HTMLParser):
    def __init__(self, html_snippet):
        HTMLParser.__init__(self)
        self.comments = []
        #self.feed(html_snippet)
        self.feed(html_snippet.read())
    def handle_comment(self, data):
        self.comments.append(data)
    def get_comments(self):
        return self.comments

def extract_status_snippet(html_snippet):
    tree = html.fromstring(html_snippet)
    snippet = tree.xpath('//span[@class="userContent"]')
    return snippet

#f = open("ayhp_page_source.html")
#response = f.read()

opener = urllib2.build_opener(urllib2.HTTPHandler(debuglevel=1))
opener.addheaders = [('User-agent', 'Mozilla/5.0')]
response = opener.open("https://www.facebook.com/pages/Alhuda-Youth-Program/1471242616483881")
myparser = MyHTMLParser(response)
#f.close()
comments = myparser.get_comments()
status_snippets = []
for comment in comments:
    statuses = extract_status_snippet(comment)
    if statuses:
        for status in statuses:
            #print 'status', tostring(status)
            status_snippets.append(tostring(status))

print "Content-type: application/json\n"
#data = {"Name": "Foo", "Id": 1234, "Rank": 7}
#print("callback(" + json.JSONEncoder().encode(data) + ");")
print("callback(" + json.dumps({"status":status_snippets}) + ");")
