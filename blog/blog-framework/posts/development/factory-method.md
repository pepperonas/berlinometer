---
title: "Das Factory Method Pattern: Flexibles Objektdesign für moderne Softwareentwicklung"
date: "2025-04-23"
excerpt: "Entdecke, wie das Factory Method Pattern dir hilft, die Objekterstellung zu abstrahieren und deine Anwendungen flexibler, wartbarer und testbarer zu gestalten."
tags: ["Design Pattern", "Factory Method", "Java", "Objektorientierung", "Clean Code"]
---

# Das Factory Method Pattern: Flexibles Objektdesign für moderne Softwareentwicklung

In der Softwareentwicklung stehen wir häufig vor dem Problem, dass wir Objekte erstellen müssen, ohne genau zu wissen, welche konkreten Klassen wir instanziieren werden. Zusätzlich wollen wir das Open/Closed-Prinzip einhalten, damit unser Code erweiterbar bleibt, ohne bestehenden Code zu verändern. Das Factory Method Pattern bietet eine elegante Lösung für diese Herausforderungen.

## Was ist das Factory Method Pattern?

Das Factory Method Pattern gehört zu den Erzeugungsmustern (Creational Patterns) und definiert eine Schnittstelle zum Erstellen von Objekten. Anstatt direkt mit dem `new`-Operator Instanzen zu erzeugen, wird die Objekterstellung an eine spezielle Methode delegiert – die Factory Method. Diese Methode entscheidet, welche konkrete Klasse instanziiert wird und gibt ein Objekt zurück, das einer gemeinsamen Schnittstelle oder einem gemeinsamen Basistyp entspricht.

Die Kernkomponenten des Factory Method Patterns sind:

1. **Product**: Eine Schnittstelle oder abstrakte Klasse, die die Gemeinsamkeiten der erzeugten Objekte definiert
2. **ConcreteProduct**: Konkrete Implementierungen des Products
3. **Creator**: Eine abstrakte Klasse oder Schnittstelle, die die Factory Method deklariert
4. **ConcreteCreator**: Implementiert die Factory Method und entscheidet, welche konkreten Produkte erstellt werden

## Wann solltest du das Factory Method Pattern verwenden?

Das Factory Method Pattern ist besonders nützlich, wenn:

- Eine Klasse die genauen Typen der zu erstellenden Objekte nicht vorhersehen kann
- Die Objekterstellung an Unterklassen delegiert werden soll
- Die Erstellung, Konfiguration und Verwendung von Objekten getrennt werden soll
- Der Erstellungsprozess komplexe Logik beinhaltet
- Du Code-Duplizierung bei der Objektkonstruktion vermeiden möchtest

## Einfache Implementierung des Factory Method Patterns

Schauen wir uns eine grundlegende Implementierung in Java an:

```java
// Das Product Interface
public interface Logger {
    void log(String message);
}

// Konkrete Produkte
public class ConsoleLogger implements Logger {
    @Override
    public void log(String message) {
        System.out.println("Console: " + message);
    }
}

public class FileLogger implements Logger {
    @Override
    public void log(String message) {
        System.out.println("File: Writing to log file: " + message);
    }
}

// Der Creator - definiert die Factory Method
public abstract class LoggerFactory {
    // Die Factory Method
    public abstract Logger createLogger();
    
    // Andere Methoden, die die Factory Method nutzen
    public void logMessage(String message) {
        Logger logger = createLogger();
        logger.log(message);
    }
}

// Konkrete Creators
public class ConsoleLoggerFactory extends LoggerFactory {
    @Override
    public Logger createLogger() {
        return new ConsoleLogger();
    }
}

public class FileLoggerFactory extends LoggerFactory {
    @Override
    public Logger createLogger() {
        return new FileLogger();
    }
}
```

Die Verwendung sieht dann folgendermaßen aus:

```java
public class LoggingApplication {
    public static void main(String[] args) {
        // Entscheidung für eine Factory
        LoggerFactory factory = new FileLoggerFactory();
        
        // Nutzung der Factory
        factory.logMessage("Testnachricht");
        
        // Einfacher Wechsel zu einer anderen Factory
        factory = new ConsoleLoggerFactory();
        factory.logMessage("Andere Testnachricht");
    }
}
```

## Variationen des Factory Method Patterns

### Parametrisierte Factory Method

Eine häufige Variation ist die parametrisierte Factory Method, die anhand eines Parameters entscheidet, welche konkrete Klasse erstellt wird:

```java
public enum LoggerType {
    CONSOLE, FILE, DATABASE
}

public class LoggerFactory {
    public static Logger createLogger(LoggerType type) {
        switch (type) {
            case CONSOLE:
                return new ConsoleLogger();
            case FILE:
                return new FileLogger();
            case DATABASE:
                return new DatabaseLogger();
            default:
                throw new IllegalArgumentException("Unbekannter Logger-Typ");
        }
    }
}

// Verwendung
Logger logger = LoggerFactory.createLogger(LoggerType.CONSOLE);
logger.log("Nachricht");
```

Diese Variation wird auch als "Simple Factory" oder "Static Factory Method" bezeichnet und ist streng genommen kein echtes Factory Method Pattern nach GoF, da es keine Vererbungshierarchie für die Creator verwendet.

### Factory Method mit generischem Creator

Eine andere Variation verwendet Generics, um den Code noch flexibler zu gestalten:

```java
public interface Factory<T> {
    T create();
}

public class ConsoleLoggerFactory implements Factory<Logger> {
    @Override
    public Logger create() {
        return new ConsoleLogger();
    }
}

// Verwendung mit Dependency Injection
public class LoggingService {
    private Factory<Logger> loggerFactory;
    
    public LoggingService(Factory<Logger> loggerFactory) {
        this.loggerFactory = loggerFactory;
    }
    
    public void logMessage(String message) {
        Logger logger = loggerFactory.create();
        logger.log(message);
    }
}
```

## Fortgeschrittenes Beispiel: Ein Dokumenten-Management-System

Betrachten wir ein umfassenderes Beispiel eines Dokumenten-Management-Systems, das verschiedene Arten von Dokumenten unterstützt:

```java
// Produkt-Interface
public interface Document {
    void open();
    void save();
    void close();
}

// Konkrete Produkte
public class PDFDocument implements Document {
    @Override
    public void open() {
        System.out.println("PDF geöffnet");
    }
    
    @Override
    public void save() {
        System.out.println("PDF gespeichert");
    }
    
    @Override
    public void close() {
        System.out.println("PDF geschlossen");
    }
}

public class WordDocument implements Document {
    @Override
    public void open() {
        System.out.println("Word-Dokument geöffnet");
    }
    
    @Override
    public void save() {
        System.out.println("Word-Dokument gespeichert");
    }
    
    @Override
    public void close() {
        System.out.println("Word-Dokument geschlossen");
    }
}

// Abstrakte Creator-Klasse
public abstract class DocumentCreator {
    // Factory Method
    public abstract Document createDocument();
    
    // Gemeinsame Logik für alle Dokumente
    public void editDocument() {
        Document document = createDocument();
        document.open();
        // Bearbeitung...
        document.save();
        document.close();
    }
}

// Konkrete Creators
public class PDFDocumentCreator extends DocumentCreator {
    @Override
    public Document createDocument() {
        return new PDFDocument();
    }
}

public class WordDocumentCreator extends DocumentCreator {
    @Override
    public Document createDocument() {
        return new WordDocument();
    }
}

// Client-Code
public class DocumentApp {
    private DocumentCreator documentCreator;
    
    public DocumentApp(DocumentCreator documentCreator) {
        this.documentCreator = documentCreator;
    }
    
    public void createAndEditDocument() {
        documentCreator.editDocument();
    }
    
    public static void main(String[] args) {
        // PDF bearbeiten
        DocumentApp pdfApp = new DocumentApp(new PDFDocumentCreator());
        pdfApp.createAndEditDocument();
        
        // Word-Dokument bearbeiten
        DocumentApp wordApp = new DocumentApp(new WordDocumentCreator());
        wordApp.createAndEditDocument();
    }
}
```

Dieses Beispiel zeigt, wie das Factory Method Pattern es ermöglicht, neue Dokumenttypen hinzuzufügen, ohne den bestehenden Code zu ändern (Open/Closed-Prinzip).

## Factory Method in Spring Framework

Das Spring Framework verwendet das Factory Method Pattern intensiv, insbesondere bei der Bean-Erstellung:

```java
@Configuration
public class LoggerConfig {
    
    @Bean
    public Logger consoleLogger() {
        return new ConsoleLogger();
    }
    
    @Bean
    public Logger fileLogger() {
        return new FileLogger();
    }
    
    @Bean
    public LoggingService loggingService() {
        // Hier entscheiden wir, welcher Logger verwendet wird
        return new LoggingService(consoleLogger());
    }
}
```

In diesem Beispiel sind die `@Bean`-Methoden Factory Methods, die Spring nutzt, um Objekte für die Dependency Injection zu erstellen.

## Factory Method vs. Abstract Factory

Es ist wichtig, das Factory Method Pattern vom verwandten Abstract Factory Pattern zu unterscheiden:

- **Factory Method**: Definiert eine Methode zur Erstellung eines einzelnen Objekts und überlässt die Implementierung den Unterklassen.
- **Abstract Factory**: Definiert eine Schnittstelle zum Erstellen von Familien verwandter Objekte, ohne ihre konkreten Klassen zu spezifizieren.

Ein vereinfachtes Beispiel für eine Abstract Factory:

```java
// Abstract Factory Interface
public interface UIFactory {
    Button createButton();
    TextField createTextField();
}

// Konkrete Factories
public class WindowsUIFactory implements UIFactory {
    @Override
    public Button createButton() {
        return new WindowsButton();
    }
    
    @Override
    public TextField createTextField() {
        return new WindowsTextField();
    }
}

public class MacUIFactory implements UIFactory {
    @Override
    public Button createButton() {
        return new MacButton();
    }
    
    @Override
    public TextField createTextField() {
        return new MacTextField();
    }
}
```

Während eine Factory Method eine einzelne Methode zur Objekterstellung definiert, bietet eine Abstract Factory mehrere Factory Methods für verwandte Objekte.

## Vorteile des Factory Method Patterns

1. **Lose Kopplung**: Der Client-Code ist von den konkreten Produktklassen entkoppelt.
2. **Single Responsibility Principle**: Die Erstellungslogik ist von der Geschäftslogik getrennt.
3. **Open/Closed Principle**: Neue Produkttypen können hinzugefügt werden, ohne bestehenden Code zu ändern.
4. **Testbarkeit**: Vereinfacht das Testen durch die Möglichkeit, Mock-Objekte zu injizieren.
5. **Kontrolle über den Erstellungsprozess**: Komplexe Initialisierungen können gekapselt werden.

## Nachteile des Factory Method Patterns

1. **Zusätzliche Komplexität**: Für einfache Fälle kann das Pattern überdimensioniert sein.
2. **Mehr Klassen**: Es erfordert zusätzliche Klassen, was die Codebasis vergrößert.
3. **Indirektion**: Der Code kann schwieriger zu lesen sein, da die Objekterstellung indirekt erfolgt.

## Best Practices für die Verwendung des Factory Method Patterns

1. **Gemeinsame Schnittstelle**: Stelle sicher, dass alle Produkte eine gemeinsame Schnittstelle implementieren.
2. **Aussagekräftige Namen**: Wähle beschreibende Namen für die Factory Methods, die klar machen, welche Art von Objekten sie erzeugen.
3. **Minimale Abhängigkeiten**: Halte die Factory Methods unabhängig von externen Zuständen.
4. **Dokumentation**: Dokumentiere klar, welche Arten von Objekten erzeugt werden und unter welchen Bedingungen.
5. **Konfigurierbarkeit**: Mache deine Factory-Implementierungen bei Bedarf konfigurierbar.

## Factory Method in anderen Sprachen

Das Factory Method Pattern lässt sich in allen objektorientierten Sprachen implementieren. Hier ist ein kurzes Beispiel in Python:

```python
from abc import ABC, abstractmethod

# Product Interface
class Document(ABC):
    @abstractmethod
    def show(self):
        pass

# Concrete Products
class PDFDocument(Document):
    def show(self):
        print("Showing PDF document")

class WordDocument(Document):
    def show(self):
        print("Showing Word document")

# Creator
class DocumentCreator(ABC):
    @abstractmethod
    def create_document(self):
        pass
    
    def show_document(self):
        document = self.create_document()
        document.show()

# Concrete Creators
class PDFDocumentCreator(DocumentCreator):
    def create_document(self):
        return PDFDocument()

class WordDocumentCreator(DocumentCreator):
    def create_document(self):
        return WordDocument()

# Client Code
if __name__ == "__main__":
    pdf_creator = PDFDocumentCreator()
    pdf_creator.show_document()
    
    word_creator = WordDocumentCreator()
    word_creator.show_document()
```

## Fazit: Wann ist das Factory Method Pattern die richtige Wahl?

Das Factory Method Pattern ist eine mächtige Technik, um die Objekterstellung zu abstrahieren und damit die Flexibilität und Wartbarkeit deiner Anwendungen zu verbessern. Es ist besonders wertvoll in komplexen Systemen, wo du:

1. Die Abhängigkeit von konkreten Klassen reduzieren möchtest
2. Erweiterbarkeit für neue Produkttypen benötigst
3. Die Erstellungslogik von der Geschäftslogik trennen willst
4. Gemeinsame Verarbeitungsschritte für verschiedene Produkttypen hast

Für einfachere Anwendungsfälle kann die Simple Factory-Variation eine pragmatischere Lösung sein. In jedem Fall ist das Factory Method Pattern ein wichtiges Werkzeug im Arsenal jedes Softwareentwicklers, das dir hilft, flexible und wartbare Systeme zu entwerfen.

Wenn du das nächste Mal vor der Herausforderung stehst, eine Klasse zu schreiben, die Objekte erstellen muss, ohne ihre genauen Typen zu kennen, denke an das Factory Method Pattern – es könnte genau das sein, was du brauchst.
