package io.celox.application.custom;

/**
 * @author Martin Pfeffer
 * <a href="mailto:martin.pfeffer@celox.io">martin.pfeffer@celox.io</a>
 * @see <a href="https://celox.io">https://celox.io</a>
 */

import com.vaadin.flow.component.Composite;
import com.vaadin.flow.component.Html;
import com.vaadin.flow.component.Tag;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.textfield.TextArea;
import com.vladsch.flexmark.html.HtmlRenderer;
import com.vladsch.flexmark.parser.Parser;
import com.vladsch.flexmark.util.ast.Node;

@Tag("markdown-view")
public class MarkdownView extends Composite<Div> {
    private final TextArea input = new TextArea();
    private final Div previewView;
    private final Parser parser;
    private final HtmlRenderer renderer;

    public MarkdownView() {
        this.previewView = new Div();
        this.parser = Parser.builder().build();
        this.renderer = HtmlRenderer.builder().build();
        this.init();
    }

    public MarkdownView(String text) {
        this.previewView = new Div();
        this.parser = Parser.builder().build();
        this.renderer = HtmlRenderer.builder().build();
        if (text != null && !text.isBlank()) {
            this.setValue(text);
        }
        this.init();
    }

    private void init() {
        // Direkt nur die Preview anzeigen
        this.previewView.setVisible(true);
        ((Div) this.getContent()).add(previewView);

        // Initiales Markdown setzen
        this.updatePreview(this.getValue().isEmpty() ? "*Nothing to preview*" : this.getValue());
    }

    private void updatePreview(String value) {
        String html = String.format("<div>%s</div>", this.parseMarkdown(value));
        Html item = new Html(html);
        this.previewView.removeAll();
        this.previewView.add(item);
    }

    private String parseMarkdown(String value) {
        Node text = this.parser.parse(value);
        return this.renderer.render(text);
    }

    public void setValue(String value) {
        this.updatePreview(value);
    }

    public String getValue() {
        return input.getValue(); // Falls nötig
    }
}

