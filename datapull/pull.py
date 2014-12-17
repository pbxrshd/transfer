#!/usr/bin/python

from HTMLParser import HTMLParser
from lxml import html

class MyHTMLParser(HTMLParser):
    def __init__(self, html_snippet):
        HTMLParser.__init__(self)
        self.comments = []
        self.feed(html_snippet)
    def handle_comment(self, data):
        self.comments.append(data)
    def get_comments(self):
        return self.comments

def extract_status_snippet(html_snippet):
    tree = html.fromstring(html_snippet)
    snippet = tree.xpath('//span[@class="userContent"]')
    return snippet
        
#f = open("ayhp_page_source_formatted.html")
f = open("ayhp_page_source.html")
response = f.read()
myparser = MyHTMLParser(response)
f.close()
comments = myparser.get_comments()
for comment in comments:
    print 'comment', comment

print 'found',len(comments),'comments'

for comment in comments:
    statuses = extract_status_snippet(comment)
    if statuses:
        for status in statuses:
            print 'status', status.text

print 'done'
